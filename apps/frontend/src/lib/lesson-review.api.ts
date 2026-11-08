import { api } from "@/lib/api-client";

export type ReviewDecision = "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
export type ReviewState = ReviewDecision | "NOT_REVIEWED";

export interface ReviewQueueItem {
  revisionId: string;
  lessonId: string;
  sourceId: string;
  title: string;
  layer: string;
  version: number;
  contentHash: string;
  reviewState: ReviewState;
  hashIntegrity: boolean;
  createdAt: string;
}

export interface StructuralCheck { id: string; label: string; passed: boolean; detail: string }
export interface GateReason { code: "CONTENT_HASH_MISMATCH" | "NOT_APPROVED_FOR_CURRENT_HASH" | "APPROVER_NOT_INDEPENDENT" | "STRUCTURE_INCOMPLETE"; message: string }
export interface GateState {
  gateEnabled: boolean;
  currentHash: string;
  storedHash: string;
  hashIntegrity: boolean;
  latestDecisionForHash: string | null;
  approved: boolean;
  structure: { lessonKind: string; passed: boolean; checks: StructuralCheck[] };
  allowed: boolean;
  reasons: GateReason[];
}

export interface ReviewHistoryItem {
  id: string;
  contentHash: string;
  decision: ReviewDecision;
  notes: string | null;
  decidedAt: string;
  reviewer: { id: string; fullName: string } | null;
}

export interface RevisionForReview {
  revision: { id: string; lessonId: string; version: number; status: string; contentHash: string; createdAt: string; publishedAt: string | null };
  lesson: { id: string; sourceId: string; title: string; layer: string; unit: string; objective: string };
  body: Record<string, unknown>;
  gate: GateState;
  publicationGate: { setting: string; enabled: boolean };
  reviews: ReviewHistoryItem[];
}

export interface ApiFailure { message: string; reasons: GateReason[] }

export async function fetchReviewQueue(): Promise<ReviewQueueItem[]> {
  const { data } = await api.get("/academy/curriculum/reviews/queue");
  return data.data;
}

export async function fetchRevisionForReview(revisionId: string): Promise<RevisionForReview> {
  const { data } = await api.get(`/academy/curriculum/revisions/${encodeURIComponent(revisionId)}/review`);
  return data.data;
}

export async function submitReviewDecision(revisionId: string, input: { decision: ReviewDecision; contentHash: string; notes?: string }): Promise<void> {
  await api.post(`/academy/curriculum/revisions/${encodeURIComponent(revisionId)}/reviews`, input);
}

export async function publishReviewedRevision(revisionId: string): Promise<void> {
  await api.post(`/academy/curriculum/revisions/${encodeURIComponent(revisionId)}/publish`);
}

/** Pulls the server's message and any gate reasons out of an axios error. */
export function failureFrom(error: unknown): ApiFailure {
  const fallback: ApiFailure = { message: "The request could not be completed. Check your permissions and try again.", reasons: [] };
  const response = (error as { response?: { data?: { message?: string; errors?: unknown } } })?.response?.data;
  if (!response) return fallback;
  const reasons = Array.isArray(response.errors) ? response.errors.filter((e): e is GateReason => typeof e === "object" && e !== null && "code" in e) : [];
  return { message: response.message ?? fallback.message, reasons };
}
