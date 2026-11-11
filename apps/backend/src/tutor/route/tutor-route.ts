/**
 * Learner tutor route: POST /api/tutor.
 *
 * Composes the pieces built earlier in src/tutor and src/ai-runtime:
 *   runtime.runPipeline  input guardrail (tutor-guardrail.ts)
 *   options.retrieve     learner-scoped retrieval over published revisions the learner may open (access/, rag/)
 *   checkGrounding       drops assessment chunks, refuses when nothing usable is left (G1)
 *   runtime.chat         the model call, through the provider failover chain
 *   screenTutorOutput    output rule O1 on the model text
 *   store                one write per turn (conversation and both messages), scoped to the learner's company
 *
 * Tenant: the company id is read from req.user.companyId, which only the auth step sets. The request body
 * is never read for it. The body must be exactly { message: string }.
 *
 * Responses: success is { reply, citations }. A policy refusal is 422 { error: 'refused', reason: <reason code>, message: <learner text> }.
 * Every other failure is a fixed { error: <code> } with no provider payload, stack trace or learner text.
 *
 * Mounting is done by mountTutorRouter(). The caller decides whether the route is mounted. See CHANGES.md.
 */
import { createHash } from 'node:crypto';
import express, { type Express, type RequestHandler, type Response, type Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { AiRuntime } from '../../ai-runtime/index.js';
import { buildCitation, type Citation } from '../../ai-runtime/citation.js';
import { tryCompanyId } from '../../ai-runtime/company.js';
import type { RetrievalResult } from '../../ai-runtime/retrieval.js';
import type { CompanyId } from '../../ai-runtime/types.js';
import { buildTutorSystemPrompt } from '../policy/system-prompt.js';
import { checkGrounding, learnerMessageFor, REASON_CODES, screenTutorOutput, type TutorReasonCode } from '../policy/tutor-guardrail.js';

/** Largest request body the route accepts, in bytes. The app-level JSON parser allows more; this route refuses above it. */
export const MAX_BODY_BYTES = 4096;
/** Largest learner message, in characters, after trimming. */
export const MAX_MESSAGE_CHARS = 2000;
export const DEFAULT_RATE_PER_MINUTE = 10;
const MAX_RATE_PER_MINUTE = 1000;
const RATE_WINDOW_MS = 60_000;

/** Structured log sink. Receives event names and small fields only. Never learner text, provider text or stacks. */
export type TutorLogger = (event: string, fields: Record<string, string | number | boolean | null>) => void;

const noopLog: TutorLogger = () => {};

export interface TutorRouteEnv {
  TUTOR_RATE_PER_MINUTE?: string;
}

/**
 * The subset of the store the route uses. PrismaTutorStore satisfies it. The route writes a turn only after the model
 * has returned a reply that passed the output rule, and it writes both messages in one call. A failed turn leaves no
 * rows behind.
 */
export interface TutorTurnStore {
  recordExchange(input: {
    companyId: CompanyId;
    learnerId: string;
    userContent: string;
    assistantContent: string;
  }): Promise<unknown>;
}

/** What retrieval gets for one request. The learner fields come from auth, never from the body. */
export interface TutorRetrieveInput {
  learnerId: string;
  role: string;
  companyId: CompanyId;
  text: string;
}

export interface TutorRouteOptions {
  runtime: Pick<AiRuntime, 'runPipeline' | 'chat'>;
  /**
   * Learner-scoped retrieval. Required: the route answers only from chunks this returns, so a missing function
   * means the route is not built. The production version only indexes revisions the learner may open.
   */
  retrieve: (input: TutorRetrieveInput) => Promise<RetrievalResult[]> | RetrievalResult[];
  store: TutorTurnStore;
  /**
   * The existing authenticate middleware (src/middleware/authenticate.ts), or a wrapper around it that also sets
   * req.user.companyId. Required: the factory throws without it, so the route is never mounted unauthenticated.
   */
  authenticate: RequestHandler;
  env: TutorRouteEnv;
  /** Optional replacement for the default per-learner limiter. It runs after authentication. */
  rateLimit?: RequestHandler;
  log?: TutorLogger;
}

interface TutorLocals {
  learnerId: string;
  role: string;
  companyId: CompanyId;
}

export type TutorBodyResult = { ok: true; message: string } | { ok: false };

/** Accepts exactly { message: string }, with 1 to MAX_MESSAGE_CHARS characters after trimming. */
export function parseTutorBody(body: unknown): TutorBodyResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false };
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'message') return { ok: false };
  const message = (body as { message: unknown }).message;
  if (typeof message !== 'string') return { ok: false };
  const trimmed = message.trim();
  if (trimmed === '' || trimmed.length > MAX_MESSAGE_CHARS) return { ok: false };
  return { ok: true, message: trimmed };
}

export function parseRatePerMinute(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_RATE_PER_MINUTE;
  const value = Number(raw.trim());
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_RATE_PER_MINUTE) {
    throw new Error(`TUTOR_RATE_PER_MINUTE must be an integer from 1 to ${MAX_RATE_PER_MINUTE}`);
  }
  return value;
}

function sendError(res: Response, status: number, error: string, extra: Record<string, string> = {}): Response {
  return res.status(status).json({ error, ...extra });
}

function statusOf(err: unknown): number {
  if (typeof err === 'object' && err !== null && 'statusCode' in err) return Number((err as { statusCode: unknown }).statusCode);
  return Number.NaN;
}

function errorName(err: unknown): string {
  return err instanceof Error ? err.name : 'unknown';
}

function defaultRateLimiter(perMinute: number): RequestHandler {
  return rateLimit({
    windowMs: RATE_WINDOW_MS,
    limit: perMinute,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (_req, res) => `learner:${String(res.locals.tutor?.learnerId ?? '')}`,
    handler: (_req, res) => sendError(res, 429, 'rate_limited'),
  });
}

function toCitation(chunk: RetrievalResult): Citation {
  return buildCitation({
    company_id: chunk.metadata.company_id,
    document_id: chunk.document_id,
    chunk_index: chunk.chunk_index,
    content: chunk.text,
    content_hash: createHash('sha256').update(chunk.text).digest('hex'),
    document_title: chunk.metadata.title,
    document_source: null,
  });
}

export function createTutorRouter(options: TutorRouteOptions): Router {
  if (typeof options.authenticate !== 'function') {
    throw new Error('createTutorRouter: the authenticate middleware is required');
  }
  if (typeof options.retrieve !== 'function') {
    throw new Error('createTutorRouter: learner-scoped retrieval is required');
  }
  const log = options.log ?? noopLog;
  const limiter = options.rateLimit ?? defaultRateLimiter(parseRatePerMinute(options.env?.TUTOR_RATE_PER_MINUTE));
  const parseJson = express.json({ limit: MAX_BODY_BYTES });
  const router = express.Router();

  const sizeGate: RequestHandler = (req, res, next) => {
    const declared = Number(req.headers['content-length'] ?? 0);
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      sendError(res, 413, 'body_too_large');
      return;
    }
    next();
  };

  const authGate: RequestHandler = (req, res, next) => {
    options.authenticate(req, res, (err?: unknown) => {
      if (err) {
        // Only an explicit 401 counts as unauthenticated. Anything else is an operational failure, reported generically.
        if (statusOf(err) === 401) sendError(res, 401, 'unauthenticated');
        else sendError(res, 503, 'unavailable');
        return;
      }
      next();
    });
  };

  const identityGate: RequestHandler = (req, res, next) => {
    const user = (req as unknown as { user?: { userId?: unknown; role?: unknown; companyId?: unknown } }).user;
    const learnerId = typeof user?.userId === 'string' && user.userId.trim() !== '' ? user.userId : null;
    if (learnerId === null) {
      sendError(res, 401, 'unauthenticated');
      return;
    }
    const companyId = tryCompanyId(user?.companyId);
    if (companyId === null) {
      sendError(res, 403, 'no_organisation');
      return;
    }
    const role = typeof user?.role === 'string' ? user.role : '';
    const locals: TutorLocals = { learnerId, role, companyId };
    res.locals.tutor = locals;
    next();
  };

  const jsonGate: RequestHandler = (req, res, next) => {
    parseJson(req, res, (err?: unknown) => {
      if (err) {
        // express.json reports an oversize body with type entity.too.large. That is 413 here, as for a declared size.
        if ((err as { type?: unknown }).type === 'entity.too.large') sendError(res, 413, 'body_too_large');
        else sendError(res, 400, 'invalid_request');
        return;
      }
      next();
    });
  };

  // The app-level JSON parser (1 MB, app.ts) runs before this router, so the body may already be parsed and the
  // parser above may not have read it. Measure the parsed body here. Chunked bodies with no declared length are caught.
  const parsedSizeGate: RequestHandler = (req, res, next) => {
    const bytes = Buffer.byteLength(JSON.stringify(req.body ?? null), 'utf8');
    if (bytes > MAX_BODY_BYTES) {
      sendError(res, 413, 'body_too_large');
      return;
    }
    next();
  };

  router.post('/', sizeGate, authGate, identityGate, limiter, jsonGate, parsedSizeGate, async (req, res) => {
    const { learnerId, role, companyId } = res.locals.tutor as TutorLocals;
    // The reason code and the learner-facing text. Neither includes the learner's words, and only the code is logged.
    const refuse = (reason: string) => {
      log('tutor_refused', { reason });
      return sendError(res, 422, 'refused', { reason, message: learnerMessageFor(reason as TutorReasonCode) });
    };

    const parsed = parseTutorBody(req.body);
    if (!parsed.ok) return sendError(res, 400, 'invalid_request');

    try {
      const pipeline = await options.runtime.runPipeline({
        companyId,
        request: { text: parsed.message },
        context: { userId: learnerId },
      });
      if (pipeline.blocked) return refuse(pipeline.reason ?? REASON_CODES.SAFETY_SIGNAL);

      // Retrieval is learner-scoped (see TutorRouteOptions.retrieve). Only chunks that survive the grounding check
      // reach the prompt or the citations.
      const retrieval = await options.retrieve({ learnerId, role, companyId, text: parsed.message });
      const grounding = checkGrounding(retrieval, { companyId });
      if (!grounding.allowed) return refuse(grounding.reasonCode);

      const passages = grounding.usable.map((chunk, i) => `[${i + 1}] ${chunk.text}`).join('\n\n');
      const chat = await options.runtime.chat({
        companyId,
        messages: [
          { role: 'system', content: `${buildTutorSystemPrompt()}\n\nCurriculum passages:\n${passages}` },
          { role: 'user', content: parsed.message },
        ],
      });
      if (!chat.ok) {
        log('tutor_provider_failed', { provider: chat.provider, status: chat.status, retryable: chat.retryable });
        return sendError(res, 503, 'tutor_unavailable');
      }

      const screened = screenTutorOutput(chat.content, { companyId });
      if (screened.blocked) return refuse(screened.reasonCode ?? REASON_CODES.OUTPUT_ANSWER_LEAK);

      // Stored only now, after a reply exists. The learner message and the reply go in one write.
      await options.store.recordExchange({
        companyId,
        learnerId,
        userContent: parsed.message,
        assistantContent: screened.text,
      });

      return res.json({ reply: screened.text, citations: grounding.usable.map(toCitation) });
    } catch (error) {
      log('tutor_error', { error_name: errorName(error) });
      return sendError(res, 503, 'tutor_unavailable');
    }
  });

  return router;
}

/**
 * Mounts the router at /api/tutor only when options.enabled is true. Returns whether it mounted.
 * When disabled, nothing is registered on the app, so the path falls through to the app's 404 handler.
 */
export function mountTutorRouter(app: Express, options: TutorRouteOptions & { enabled: boolean }): boolean {
  if (!options.enabled) return false;
  app.use('/api/tutor', createTutorRouter(options));
  return true;
}
