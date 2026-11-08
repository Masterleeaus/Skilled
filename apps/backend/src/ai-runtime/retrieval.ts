/**
 * Retrieval. Ported from TitanPro:
 *   - Modules/TitanZero/Services/Retrieval/ManifestDrivenRetrievalService.php (term split, scoring, top-k)
 *   - Modules/TitanZero/DTO/RetrievalResult.php (result shape, from its constructor call sites)
 *   - Modules/TitanCore/Contracts/AI/RetrievalContract.php (the pipeline stage contract)
 *
 * Keyword retrieval only. TitanPro has no embedding search in this path. Vector stores (Pgvector, Pinecone,
 * Qdrant) are separate and are not ported here.
 *
 * Changes from TitanPro (see PORT-MAP.md):
 * - companyId is required. TitanPro accepts null as a platform-wide search. That is not ported.
 * - Every candidate is checked against companyId, and a candidate from another tenant is dropped.
 * - The scorer ranks every candidate the store returns. TitanPro's query keeps only the 15 newest LIKE
 *   matches before scoring, so an older, better match is never seen. The store must now apply the term
 *   filter and limit without ordering by recency.
 * - extractTerms() drops English function words (STOPWORDS). TitanPro has no stopword list, so a question such
 *   as "the" or "what is the" matched every chunk that contained it. A question made only of stopwords now has
 *   no terms, and retrieveChunks() returns [] without calling the store.
 *
 * Pure functions except retrieveChunks(), which calls the injected store.
 */
import { requireCompanyId, tryCompanyId } from './company.js';
import type { CompanyId } from './types.js';

export const DEFAULT_TOP_K = 5;
export const MIN_TERM_LENGTH = 3;
export const OVERFETCH_MULTIPLIER = 3;
export const PREFERENCE_WEIGHT_DIVISOR = 20;
export const MAX_PREFERENCE_BOOST = 5;

/**
 * English function words. A term in this set is not a search term, whatever its length. Words are compared
 * lower-cased, with leading and trailing punctuation removed, so "the." and "The" are both dropped.
 * Content words that a course might use (such as "use", "make" or "get") are deliberately not listed.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during',
  'each', 'either', 'else', 'ever', 'every',
  'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'me', 'might', 'more', 'most', 'must', 'my', 'myself',
  'neither', 'no', 'nor', 'not', 'now',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'others', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shall', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'whose', 'why', 'will', 'with',
  'would', 'you', 'your', 'yours', 'yourself', 'yourselves',
]);

export interface RetrievalPolicy {
  top_k?: number;
  strategy?: string;
}

export interface DocumentMetadata {
  title: string | null;
  doc_type: string | null;
  authority_level: string | null;
  jurisdiction: string | null;
  is_superseded: boolean;
  preferred_weight: number;
  source: string | null;
}

export interface ChunkCandidate {
  /** Owning tenant of the document this chunk belongs to. */
  company_id: CompanyId;
  document_id: number;
  chunk_index: number;
  content: string;
  document: DocumentMetadata | null;
}

export interface RetrievalResult {
  chunk_id: string;
  document_id: number;
  chunk_index: number;
  text: string;
  metadata: {
    title: string | null;
    doc_type: string | null;
    authority_level: string | null;
    jurisdiction: string | null;
    is_superseded: boolean;
    preferred_weight: number;
    company_id: CompanyId;
  };
  score: number;
}

export interface RetrievalStoreQuery {
  companyId: CompanyId;
  terms: string[];
  /** Upper bound on candidates. Must be applied after the term filter, not by recency. */
  limit: number;
}

export interface RetrievalStore {
  findCandidates(query: RetrievalStoreQuery): Promise<ChunkCandidate[]>;
}

/** Top-k from an explicit limit, then the policy, then the default. Values below 1 fall back to the default. */
export function resolveTopK(policy: RetrievalPolicy = {}, limit?: number): number {
  const raw = limit ?? policy.top_k ?? DEFAULT_TOP_K;
  const topK = Math.floor(Number(raw));
  return Number.isFinite(topK) && topK >= 1 ? topK : DEFAULT_TOP_K;
}

/**
 * Splits a query on whitespace, lower-cases it, removes leading and trailing punctuation from each word, de-duplicates,
 * drops terms shorter than 3 code points, and drops stopwords (see STOPWORDS). So "safety, rules" gives
 * ["safety", "rules"], and both the length check and the stopword check use the cleaned word.
 */
export function extractTerms(query: string): string[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === '') return [];
  const words = trimmed
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((word) => word !== '');
  const unique = [...new Set(words)];
  return unique.filter((term) => [...term].length >= MIN_TERM_LENGTH && !STOPWORDS.has(term));
}

/** Score = number of terms found in the chunk + capped boost from the document's preferred_weight. */
export function scoreCandidate(candidate: ChunkCandidate, terms: string[]): number {
  const text = candidate.content.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (text.includes(term)) score++;
  }
  const pref = Math.trunc(Number(candidate.document?.preferred_weight ?? 0));
  if (pref > 0) {
    score += Math.min(MAX_PREFERENCE_BOOST, Math.floor(pref / PREFERENCE_WEIGHT_DIVISOR));
  }
  return score;
}

/**
 * Ranks candidates for one tenant. Drops candidates from other tenants or with an invalid tenant id,
 * drops zero-score candidates, sorts by score (stable), and keeps the top k.
 */
export function rankCandidates(
  candidates: readonly ChunkCandidate[],
  options: { companyId: CompanyId; terms: string[]; topK: number },
): RetrievalResult[] {
  const scored: { candidate: ChunkCandidate; score: number }[] = [];
  for (const candidate of candidates) {
    if (tryCompanyId(candidate.company_id) !== options.companyId) continue;
    const score = scoreCandidate(candidate, options.terms);
    if (score > 0) scored.push({ candidate, score });
  }
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, options.topK).map(({ candidate, score }) => ({
    chunk_id: `${candidate.document_id}:${candidate.chunk_index}`,
    document_id: candidate.document_id,
    chunk_index: candidate.chunk_index,
    text: candidate.content,
    metadata: {
      title: candidate.document?.title ?? null,
      doc_type: candidate.document?.doc_type ?? null,
      authority_level: candidate.document?.authority_level ?? null,
      jurisdiction: candidate.document?.jurisdiction ?? null,
      is_superseded: candidate.document?.is_superseded === true,
      preferred_weight: Number(candidate.document?.preferred_weight ?? 0),
      company_id: options.companyId,
    },
    score,
  }));
}

/**
 * Retrieves chunks for a query, scoped to one tenant. Returns [] without calling the store when the
 * query has no usable terms.
 */
export async function retrieveChunks(input: {
  companyId: CompanyId;
  query: string;
  policy?: RetrievalPolicy;
  limit?: number;
  store: RetrievalStore;
}): Promise<RetrievalResult[]> {
  const companyId = requireCompanyId(input.companyId);
  const topK = resolveTopK(input.policy, input.limit);
  const terms = extractTerms(input.query ?? '');
  if (terms.length === 0) return [];

  const candidates = await input.store.findCandidates({
    companyId,
    terms,
    limit: topK * OVERFETCH_MULTIPLIER,
  });
  return rankCandidates(candidates, { companyId, terms, topK });
}
