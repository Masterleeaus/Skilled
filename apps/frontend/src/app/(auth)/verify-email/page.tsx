"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AuthBrand } from "@/components/AuthBrand";
import { verifyEmail } from "@/lib/auth.api";
import { useLocationSearch } from "@/hooks/useLocationSearch";

type Status = "checking" | "ready" | "working" | "verified" | "error";

const MISSING_TOKEN = "Your verification link does not contain a token.";

export default function VerifyEmailPage() {
  // The URL is read after hydration. Until the page has submitted, the status follows the token in the link.
  const search = useLocationSearch();
  const token = search === null ? "" : (new URLSearchParams(search).get("token") ?? "").trim();
  const [flow, setFlow] = useState<Status>("checking");
  const [submitError, setSubmitError] = useState("");
  const submitted = useRef(false);

  const status: Status = flow === "checking" && search !== null ? (token ? "ready" : "error") : flow;
  const error = flow === "checking" && search !== null && !token ? MISSING_TOKEN : submitError;
  async function submit() {
    if (!token || submitted.current) return;
    submitted.current = true;
    setFlow("working");
    setSubmitError("");
    try {
      await verifyEmail(token);
      setFlow("verified");
    } catch {
      setSubmitError("The verification link is invalid, expired or has already been used.");
      setFlow("error");
      submitted.current = false;
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-sm space-y-5 text-center">
        <AuthBrand />
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
