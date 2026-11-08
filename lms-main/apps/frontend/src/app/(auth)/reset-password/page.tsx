"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/auth.api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [working, setWorking] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token")?.trim() ?? "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return setError("The password-reset link is missing a token.");
    if (password.length < 8 || password.length > 72) return setError("Password must be 8 to 72 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setWorking(true);
    setError("");
    try {
      await resetPassword(token, password);
      setComplete(true);
    } catch {
      setError("The reset link is invalid or expired. Request a new link.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-sm space-y-5">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        {complete ? (
          <p role="status">Your password has been reset. Sign in with your new password.</p>
        ) : token === null ? (
          <p role="status">Checking reset link...</p>
        ) : !token ? (
          <p role="alert">The password-reset link is missing a token.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label htmlFor="new-password" className="block text-sm">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" required
              minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3" />
            <label htmlFor="confirm-password" className="block text-sm">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" required
              minLength={8} maxLength={72} value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-3" />
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={working} className="w-full rounded-lg bg-white p-3 text-neutral-900 disabled:opacity-60">
              {working ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
        <Link href="/login" className="block text-sm underline">Go to login</Link>
        {!complete && <Link href="/forgot-password" className="block text-sm underline">Request a new link</Link>}
      </section>
    </main>
  );
}
