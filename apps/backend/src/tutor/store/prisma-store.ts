/**
 * Prisma-backed store for tutor conversations, messages and tool audit rows.
 *
 * - The Prisma client is a constructor argument. Nothing here constructs PrismaClient, so tests inject a fake.
 * - Every method requires a companyId, checked with the runtime's requireCompanyId(). The value is the organisation id
 *   (Company.id). It is stored in companyId on every row.
 * - Rows are read and written only inside the company's scope. A conversation from another company is reported as
 *   not found.
 * - toolAuditSink() returns the function that ToolExecutorOptions.audit expects. It is the runtime port this store
 *   satisfies. The runtime has no port for conversations or messages. Those methods are the store's own API.
 *
 * Not verified here: tsc has not been run, and the real PrismaClient has not been type-checked against
 * TutorPrismaClient.
 */
import { randomUUID } from 'node:crypto';
import { requireCompanyId } from '../../ai-runtime/company.js';
import type { CompanyId } from '../../ai-runtime/types.js';
import type { ToolAuditEntry } from '../../ai-runtime/tools.js';

export type TutorChatRole = 'system' | 'user' | 'assistant' | 'tool';
export type TutorToolAuditStatus = 'success' | 'dry_run' | 'blocked' | 'failed' | 'timed_out';

const CHAT_ROLES: ReadonlySet<string> = new Set(['system', 'user', 'assistant', 'tool']);
const AUDIT_STATUSES: ReadonlySet<string> = new Set(['success', 'dry_run', 'blocked', 'failed', 'timed_out']);
const MAX_LIST_LIMIT = 500;
const DEFAULT_LIST_LIMIT = 50;

export type TutorStoreErrorCode = 'conversation_not_found' | 'input_invalid' | 'scope_mismatch' | 'config_invalid';

export class TutorStoreError extends Error {
  readonly code: TutorStoreErrorCode;

  constructor(code: TutorStoreErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'TutorStoreError';
    this.code = code;
  }
}

interface ConversationRow {
  id: string;
  companyId: string;
  learnerId: string;
  createdAt: Date;
}

interface MessageRow {
  id: string;
  companyId: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface ToolAuditRow {
  id: string;
  companyId: string;
  conversationId: string;
  tool: string;
  userId: string | null;
  inputHash: string;
  status: string;
  durationMs: number;
  error: string | null;
  createdAt: Date;
}

/** The subset of the Prisma client this store uses. The real PrismaClient provides it. */
export interface TutorPrismaClient {
  /** Runs the operations in one database transaction. The real client supports the array form. */
  $transaction(operations: Promise<unknown>[]): Promise<unknown[]>;
  academyTutorConversation: {
    create(args: { data: { id?: string; companyId: string; learnerId: string } }): Promise<ConversationRow>;
    findFirst(args: { where: { id: string; companyId: string }; select: { id: true } }): Promise<{ id: string } | null>;
  };
  academyTutorMessage: {
    create(args: {
      data: { companyId: string; conversationId: string; role: string; content: string };
    }): Promise<MessageRow>;
    findMany(args: {
      where: { companyId: string; conversationId: string };
      orderBy: { createdAt: 'asc' };
      take: number;
    }): Promise<MessageRow[]>;
  };
  academyTutorToolAudit: {
    create(args: {
      data: {
        companyId: string;
        conversationId: string;
        tool: string;
        userId: string | null;
        inputHash: string;
        status: string;
        durationMs: number;
        error: string | null;
      };
    }): Promise<ToolAuditRow>;
  };
}

export interface TutorConversation {
  id: string;
  companyId: CompanyId;
  learnerId: string;
  createdAt: Date;
}

export interface TutorMessage {
  id: string;
  companyId: CompanyId;
  conversationId: string;
  role: TutorChatRole;
  content: string;
  createdAt: Date;
}

export interface TutorToolAuditRecord {
  id: string;
  companyId: CompanyId;
  conversationId: string;
  tool: string;
  userId: string | null;
  inputHash: string;
  status: TutorToolAuditStatus;
  durationMs: number;
  error: string | null;
  createdAt: Date;
}

function requireNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TutorStoreError('input_invalid', `${name} is required`);
  }
  return value;
}

function requireConversationId(value: unknown): string {
  return requireNonEmptyString(value, 'conversationId');
}

function requireListLimit(value: unknown): number {
  if (value === undefined) return DEFAULT_LIST_LIMIT;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > MAX_LIST_LIMIT) {
    throw new TutorStoreError('input_invalid', `limit must be an integer from 1 to ${MAX_LIST_LIMIT}`);
  }
  return value;
}

export class PrismaTutorStore {
  private readonly prisma: TutorPrismaClient;

  constructor(prisma: TutorPrismaClient) {
    if (
      !prisma ||
      typeof prisma.$transaction !== 'function' ||
      typeof prisma.academyTutorConversation?.create !== 'function' ||
      typeof prisma.academyTutorConversation?.findFirst !== 'function' ||
      typeof prisma.academyTutorMessage?.create !== 'function' ||
      typeof prisma.academyTutorMessage?.findMany !== 'function' ||
      typeof prisma.academyTutorToolAudit?.create !== 'function'
    ) {
      throw new TutorStoreError('config_invalid', 'a Prisma client with the tutor delegates is required');
    }
    this.prisma = prisma;
  }

  async createConversation(input: { companyId: CompanyId; learnerId: string }): Promise<TutorConversation> {
    const companyId = requireCompanyId(input?.companyId);
    const learnerId = requireNonEmptyString(input?.learnerId, 'learnerId');
    const row = await this.prisma.academyTutorConversation.create({ data: { companyId, learnerId } });
    return { id: row.id, companyId: companyId, learnerId: row.learnerId, createdAt: row.createdAt };
  }

  /**
   * Stores one completed turn: a new conversation, the learner's message and the assistant's reply. The three rows go
   * in one transaction, so a failure leaves none of them. The route calls this only after a reply has passed the
   * output rule.
   */
  async recordExchange(input: {
    companyId: CompanyId;
    learnerId: string;
    userContent: string;
    assistantContent: string;
  }): Promise<{ id: string }> {
    const companyId = requireCompanyId(input?.companyId);
    const learnerId = requireNonEmptyString(input?.learnerId, 'learnerId');
    if (typeof input.userContent !== 'string' || typeof input.assistantContent !== 'string') {
      throw new TutorStoreError('input_invalid', 'content must be a string');
    }
    // The id is set here so the message rows can name their conversation in the same batch.
    const id = randomUUID();
    await this.prisma.$transaction([
      this.prisma.academyTutorConversation.create({ data: { id, companyId, learnerId } }),
      this.prisma.academyTutorMessage.create({
        data: { companyId, conversationId: id, role: 'user', content: input.userContent },
      }),
      this.prisma.academyTutorMessage.create({
        data: { companyId, conversationId: id, role: 'assistant', content: input.assistantContent },
      }),
    ]);
    return { id };
  }

  async appendMessage(input: {
    companyId: CompanyId;
    conversationId: string;
    role: TutorChatRole;
    content: string;
  }): Promise<TutorMessage> {
    const companyId = requireCompanyId(input?.companyId);
    const conversationId = requireConversationId(input?.conversationId);
    if (!CHAT_ROLES.has(input.role)) {
      throw new TutorStoreError('input_invalid', 'role must be system, user, assistant or tool');
    }
    if (typeof input.content !== 'string') {
      throw new TutorStoreError('input_invalid', 'content must be a string');
    }
    await this.requireConversationInScope(companyId, conversationId);
    const row = await this.prisma.academyTutorMessage.create({
      data: { companyId, conversationId, role: input.role, content: input.content },
    });
    return toMessage(row);
  }

  async listMessages(input: { companyId: CompanyId; conversationId: string; limit?: number }): Promise<TutorMessage[]> {
    const companyId = requireCompanyId(input?.companyId);
    const conversationId = requireConversationId(input?.conversationId);
    const take = requireListLimit(input.limit);
    const rows = await this.prisma.academyTutorMessage.findMany({
      where: { companyId, conversationId },
      orderBy: { createdAt: 'asc' },
      take,
    });
    return rows.map(toMessage);
  }

  async recordToolAudit(input: {
    companyId: CompanyId;
    conversationId: string;
    entry: ToolAuditEntry;
  }): Promise<TutorToolAuditRecord> {
    const companyId = requireCompanyId(input?.companyId);
    const conversationId = requireConversationId(input?.conversationId);
    const entry = input.entry;
    if (!entry || typeof entry !== 'object') {
      throw new TutorStoreError('input_invalid', 'entry is required');
    }
    if (requireCompanyId(entry.company_id) !== companyId) {
      throw new TutorStoreError('scope_mismatch', 'audit entry belongs to a different company');
    }
    if (!AUDIT_STATUSES.has(entry.status)) {
      throw new TutorStoreError('input_invalid', 'audit status is not recognised');
    }
    if (!Number.isSafeInteger(entry.duration_ms) || entry.duration_ms < 0) {
      throw new TutorStoreError('input_invalid', 'duration_ms must be a non-negative integer');
    }
    await this.requireConversationInScope(companyId, conversationId);
    const row = await this.prisma.academyTutorToolAudit.create({
      data: {
        companyId,
        conversationId,
        tool: requireNonEmptyString(entry.tool, 'tool'),
        userId: entry.user_id === null || entry.user_id === undefined ? null : String(entry.user_id),
        inputHash: requireNonEmptyString(entry.input_hash, 'input_hash'),
        status: entry.status,
        durationMs: entry.duration_ms,
        error: entry.error ?? null,
      },
    });
    return toAudit(row);
  }

  /**
   * Returns the function to pass as ToolExecutorOptions.audit for one conversation. Every entry it receives must carry
   * the same companyId, or the write is refused.
   */
  toolAuditSink(input: { companyId: CompanyId; conversationId: string }): (entry: ToolAuditEntry) => Promise<TutorToolAuditRecord> {
    const companyId = requireCompanyId(input?.companyId);
    const conversationId = requireConversationId(input?.conversationId);
    return (entry: ToolAuditEntry) => this.recordToolAudit({ companyId, conversationId, entry });
  }

  private async requireConversationInScope(companyId: string, conversationId: string): Promise<void> {
    const found = await this.prisma.academyTutorConversation.findFirst({
      where: { id: conversationId, companyId },
      select: { id: true },
    });
    if (!found) {
      throw new TutorStoreError('conversation_not_found', 'conversation not found for this company');
    }
  }
}

function toMessage(row: MessageRow): TutorMessage {
  return {
    id: row.id,
    companyId: row.companyId,
    conversationId: row.conversationId,
    role: row.role as TutorChatRole,
    content: row.content,
    createdAt: row.createdAt,
  };
}

function toAudit(row: ToolAuditRow): TutorToolAuditRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    conversationId: row.conversationId,
    tool: row.tool,
    userId: row.userId,
    inputHash: row.inputHash,
    status: row.status as TutorToolAuditStatus,
    durationMs: row.durationMs,
    error: row.error,
    createdAt: row.createdAt,
  };
}
