"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { fetchMyEnrollments } from "@/lib/enrollment.api";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type PaymentState = "checking" | "paid" | "pending" | "failed";

/** Stripe redirect is informational; Academy still validates payment server-side. */
export default function PaymentSuccessPage() {
  const { user } = useRequireAuth(["STUDENT"]);
  const [state, setState] = useState<PaymentState>("checking");
  const [courseHref, setCourseHref] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId || !/^cs_(test_|live_)[a-zA-Z0-9]+$/.test(sessionId)) {
      setState("failed");
      return;
    }
    let cancelled = false;
    async function checkPayment(verifiedSessionId: string) {
      try {
        const { data } = await api.get(`/payments/verify/${encodeURIComponent(verifiedSessionId)}`);
        if (cancelled) return;
        if (data.data?.status !== "SUCCEEDED") {
          setState("pending");
          return;
        }
        setState("paid");
        const enrollments = await fetchMyEnrollments();
        if (cancelled) return;
        const match = enrollments.find((entry) => entry.course.id === data.data.courseId);
        if (match) setCourseHref(`/student/courses/${encodeURIComponent(match.course.slug)}?track=${encodeURIComponent(match.licenceTrack)}`);
      } catch {
        if (!cancelled) setState("failed");
      }
    }
    void checkPayment(sessionId);
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;
  return (
    <main className="mx-auto max-w-xl space-y-5 p-8">
      <h1 className="text-2xl font-semibold">Course payment</h1>
      {state === "checking" && <p role="status">Confirming your payment securely...</p>}
      {state === "paid" && <p role="status">Payment confirmed. Your course is available.</p>}
      {state === "pending" && <p role="status">Your payment is still processing. Check My Courses shortly, or contact support if it does not appear.</p>}
      {state === "failed" && <p role="alert">We could not confirm this checkout. No enrolment was granted by this page. Check My Courses or contact support.</p>}
      {courseHref && <Link href={courseHref} className="block underline">Start learning</Link>}
      <Link href="/student" className="block underline">Go to My Courses</Link>
    </main>
  );
}
