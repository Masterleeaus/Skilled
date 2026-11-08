"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { verifyEmail } from "@/lib/auth.api";

type Status = "checking" | "ready" | "working" | "verified" | "error";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState("");
  const submitted = useRef(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
    setToken(fromUrl);
    setStatus(fromUrl ? "ready" : "error");
    if (!fromUrl) setError("Your verification link does not contain a token.");
  }, []);

  async function submit() {
    if (!token || submitted.current) return;
    submitted.current = true;
    setStatus("working");
    setError("");
    try {
      await verifyEmail(token);
      setStatus("verified");
    } catch {
      setError("The verification link is invalid, expired or has already been used.");
      setStatus("error");
      submitted.current = false;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-sm space-y-5 text-center">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        {status === "checking" && <p role="status">Checking link...</p>}
        {status === "ready" && <button onClick={submit} className="w-full rounded-lg bg-white p-3 text-neutral-900">Verify my email</button>}
        {status === "working" && <p role="status">Verifying your account...</p>}
        {status === "verified" && <p role="status">Your email is verified. You can now log in.</p>}
        {status === "error" && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <Link href="/login" className="block text-sm underline">Go to login</Link>
      </section>
    </main>
  );
}
