"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SkilledWordmark } from "@/components/SkilledWordmark";

const features = [
  { icon: "📚", title: "Learn practical skills", text: "Clear lessons and course pathways built around real work." },
  { icon: "✓", title: "Show what you know", text: "Knowledge checks help learners and trainers see progress." },
  { icon: "✦", title: "Build verified capability", text: "Submit practical evidence for review by an assessor." },
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-8">
        <SkilledWordmark />
        <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          <Link href="/courses" className="hidden text-slate-300 hover:text-white sm:block">
            Explore courses
          </Link>
          <Link href="/login" className="text-slate-300 hover:text-white">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">SkilledAt.Work</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Practical learning for the work you do.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Build job-ready knowledge, follow a clear learning path, and show your skills through evidence-backed progress.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/courses"
              className="rounded-lg bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Explore courses
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-900"
            >
              Create an account
            </Link>
          </div>
        </section>

        <section aria-label="How Skilled helps" className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-800 text-lg text-emerald-300">
                {feature.icon}
              </span>
              <h2 className="mt-5 font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-slate-800 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:px-8">
        <span>SkilledAt.Work · Practical skills for work</span>
        <Link href="/credits" className="underline decoration-slate-700 underline-offset-4 hover:text-slate-300">
          Credits and disclosures
        </Link>
      </footer>
    </div>
  );
}
