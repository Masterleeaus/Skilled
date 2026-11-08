import { create } from "zustand";

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

// NOTE: intentionally NOT persisted to localStorage — access token lives only
// in memory, refresh token is an httpOnly cookie the browser manages. On a
// hard refresh, the app calls /auth/refresh once on mount (see AuthProvider)
// to silently re-establish the session.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logout: () => set({ user: null, accessToken: null }),
}));
