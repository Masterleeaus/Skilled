import { api } from "@/lib/api-client";

// Assessor review of practical evidence. The server enforces organisation role and self-review rules;
// these helpers only shape requests and responses.
export interface PendingPracticalEvidence {
  id: string;
  companyId: string;
  learnerId: string;
  lessonId: string;
  revisionId: string;
  description: string;
  evidenceUrls: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface PracticalEvidenceDecision {
  decision: "APPROVED" | "REJECTED";
  feedback: string;
  expiresAt?: string;
}

export async function fetchPendingPracticalEvidence(companyId: string): Promise<PendingPracticalEvidence[]> {
  const { data } = await api.get(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/practical-evidence/pending`);
  return data.data;
}

export async function reviewPracticalEvidence(companyId: string, evidenceId: string, decision: PracticalEvidenceDecision): Promise<PendingPracticalEvidence> {
  const { data } = await api.post(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/practical-evidence/${encodeURIComponent(evidenceId)}/review`, decision);
  return data.data;
}
