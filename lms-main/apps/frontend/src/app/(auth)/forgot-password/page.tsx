"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthBrand } from "@/components/AuthBrand";
import { forgotPassword } from "@/lib/auth.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setWorking(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Unable to submit the request. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-sm space-y-5">
        <AuthBrand />
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        {sent ? (
          <p role="status" className="text-sm text-neutral-300">
            If an account exists for that email, a password reset link has been sent.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label htmlFor="email" className="block text-sm">Account email</label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3" />
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button disabled={working} type="submit" className="w-full rounded-lg bg-white p-3 text-neutral-900 disabled:opacity-60">
              {working ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
        <Link href="/login" className="block text-sm underline">Back to login</Link>
      </section>
    </main>
  );
}
