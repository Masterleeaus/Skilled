import { api } from "@/lib/api-client";

export type PathwayItemKind = "MODULE" | "COURSE" | "SERVICE";
export type PathwayItemState = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "NO_LESSONS" | "OPTIONAL";
export type PathwayProgressStatus = "NO_REQUIRED_ITEMS" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface PathwayEnrolment {
  id: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  companyId: string | null;
}

export interface PathwayProgressSummary {
  percentage: number;
  status: PathwayProgressStatus;
  requiredCompleted: number;
  requiredTotal: number;
}

export interface PathwaySummary {
  code: string;
  title: string;
  description: string;
  status: string;
  itemCount: number;
  requiredCount: number;
  enrolment: PathwayEnrolment | null;
  progress: PathwayProgressSummary | null;
}

export interface PathwayItem {
  key: string;
  kind: PathwayItemKind;
  label: string;
  title: string | null;
  inCatalogue: boolean | null;
  required: boolean;
  state: PathwayItemState;
  lessonsCompleted: number | null;
  lessonsTotal: number | null;
}

export interface PathwayDetail {
  code: string;
  title: string;
  description: string;
  status: string;
  items: PathwayItem[];
  enrolment: PathwayEnrolment | null;
  progress: (PathwayProgressSummary & { items: PathwayItem[] }) | null;
}

export async function fetchPathways(): Promise<PathwaySummary[]> {
  const { data } = await api.get("/academy/pathways");
  return data.data as PathwaySummary[];
}

export async function fetchPathway(code: string): Promise<PathwayDetail> {
  const { data } = await api.get(`/academy/pathways/${encodeURIComponent(code)}`);
  return data.data as PathwayDetail;
}

export async function enrolInPathway(code: string) {
  const { data } = await api.post(`/academy/pathways/${encodeURIComponent(code)}/enrolments`, {});
  return data.data;
}
