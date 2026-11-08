"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { login } from "@/lib/auth.api";
import { useAuthStore } from "@/store/auth.store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await login(values);
      setAuth(result.user, result.accessToken);

      const dest =
        result.user.role === "ADMIN" ? "/admin" : result.user.role === "TEACHER" ? "/teacher" : "/student";
      router.push(dest);
    } catch (err: unknown) {
      setServerError(apiErrorMessage(err) ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-neutral-400">Log in to continue learning.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm text-neutral-300">Email</label>
            <input
              id="login-email"
              {...register("email")}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm text-neutral-300">Password</label>
            <input
              id="login-password"
              {...register("password")}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>
        <Link href="/forgot-password" className="block text-sm underline">Forgot your password?</Link>

        <p className="text-sm text-neutral-400">
          No account?{" "}
          <Link href="/register" className="text-white underline underline-offset-2">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
