"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { register as registerUser } from "@/lib/auth.api";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterForm) {
    setServerError(null);
    setSubmitting(true);
    try {
      await registerUser(values);
      setDone(true);
    } catch (err: unknown) {
      setServerError(apiErrorMessage(err) ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm text-neutral-400">
            We sent a verification link. Click it to activate your account, then log in.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm underline underline-offset-2">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-neutral-400">Start learning today. Teaching access is granted by an administrator.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="register-full-name" className="mb-1 block text-sm text-neutral-300">Full name</label>
            <input
              id="register-full-name"
              {...register("fullName")}
              autoComplete="name"
              aria-invalid={errors.fullName ? true : undefined}
              aria-describedby={errors.fullName ? "register-full-name-error" : undefined}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {errors.fullName && <p id="register-full-name-error" className="mt-1 text-xs text-red-400">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm text-neutral-300">Email</label>
            <input
              id="register-email"
              {...register("email")}
              type="email"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {errors.email && <p id="register-email-error" className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm text-neutral-300">Password</label>
            <input
              id="register-password"
              {...register("password")}
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "register-password-error" : undefined}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {errors.password && <p id="register-password-error" className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
