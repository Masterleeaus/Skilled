import { api } from "@/lib/api-client";

export interface DiscussionThread {
  id: string;
  title: string;
  body: string;
  isResolved: boolean;
  createdAt: string;
  student: { fullName: string; avatarUrl: string | null };
  _count: { replies: number };
}

export interface DiscussionReply {
  id: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  user: { fullName: string; role: string };
}

export interface DiscussionThreadDetail extends Omit<DiscussionThread, "_count"> {
  replies: DiscussionReply[];
}

export async function fetchThreads(courseId: string) {
  const { data } = await api.get(`/discussions/course/${courseId}`);
  return data.data as DiscussionThread[];
}

export async function fetchThread(threadId: string) {
  const { data } = await api.get(`/discussions/threads/${threadId}`);
  return data.data as DiscussionThreadDetail;
}

export async function createThread(courseId: string, title: string, body: string) {
  const { data } = await api.post("/discussions/threads", { courseId, title, body });
  return data.data;
}

export async function addReply(threadId: string, body: string) {
  const { data } = await api.post(`/discussions/threads/${threadId}/replies`, { body });
  return data.data;
}

export async function resolveThread(threadId: string) {
  const { data } = await api.patch(`/discussions/threads/${threadId}/resolve`);
  return data.data;
}

export async function pinReply(replyId: string) {
  const { data } = await api.patch(`/discussions/replies/${replyId}/pin`);
  return data.data;
}
