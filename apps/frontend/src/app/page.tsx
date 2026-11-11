"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  { icon: "🎓", title: "Curriculum lessons", text: "Lessons are versioned. Only published revisions reach learners, and drafts stay in review until a person approves them." },
  { icon: "📝", title: "Knowledge checks", text: "Questions are graded on the server with an 80% pass mark. Answer keys are never sent to learners." },
  { icon: "🛠️", title: "Practical evidence", text: "Learners submit evidence and an assessor in the organisation approves or rejects it. Approval creates a competency that can expire. Acknowledging a lesson never creates one." },
  { icon: "🏢", title: "Organisation training", text: "Managers assign courses to members of their organisation and follow their progress." },
  { icon: "🧭", title: "Business-specific context", text: "Managers set field values for their business. Only approved values appear in lessons, saved as immutable snapshots with integrity checks." },
  { icon: "📊", title: "Completion reports", text: "Completion reports for a learner or an organisation, based on recorded lesson, check and competency evidence." },
];
export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const dest = user.role === "ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/student";
      router.replace(dest);
    }
  }, [user, router]);

  if (user) return null;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <span className="text-lg font-semibold">SkilledAt.Work</span>
        <nav className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          <Link href="/courses" className="text-neutral-400 hover:text-neutral-200">
            Browse Courses
          </Link>
          <Link href="/login" className="text-neutral-400 hover:text-neutral-200">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white px-4 py-1.5 font-medium text-neutral-900 hover:bg-neutral-200"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Practical training for field and home-service teams
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-400">
          Skilled brings together curriculum lessons, knowledge checks, practical evidence reviewed by
          an assessor, and business-specific context. Managers assign training to their organisation.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            Create account
          </Link>
          <Link
            href="/courses"
            className="rounded-lg border border-neutral-700 px-6 py-2.5 text-sm hover:bg-neutral-900"
          >
            Browse courses
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-800 px-6 py-8 text-center text-xs text-neutral-500">
        <p>Built with Next.js, Express, PostgreSQL, and Redis.</p>
        <p className="mt-2">
          <Link href="/credits" className="underline hover:text-neutral-300">
            Credits and disclosures
          </Link>
        </p>
      </footer>
    </div>
  );
}
