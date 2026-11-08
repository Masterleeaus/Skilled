import { api } from "@/lib/api-client";
import type { AuthUser } from "@/store/auth.store";

export async function register(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post("/auth/register", input);
  return data.data as { id: string; email: string; fullName: string };
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", input);
  return data.data as { accessToken: string; user: AuthUser };
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data.data as AuthUser & { avatarUrl: string | null; isEmailVerified: boolean; createdAt: string };
}

export async function updateProfile(input: { fullName?: string; avatarUrl?: string }) {
  const { data } = await api.patch("/auth/me", input);
  return data.data;
}

export async function verifyEmail(token: string) {
  const { data } = await api.post("/auth/verify-email", { token });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post("/auth/reset-password", { token, password });
  return data;
}
