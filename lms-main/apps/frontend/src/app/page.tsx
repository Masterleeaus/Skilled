"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { ThemeToggle } from "@/components/ThemeToggle";

const features = [
  { icon: "🎓", title: "Structured Courses", text: "Modules, lessons, and video content organized for real learning." },
  { icon: "📝", title: "Quizzes & Assignments", text: "Auto-graded quizzes and file-based assignments with teacher feedback." },
  { icon: "📅", title: "Live Classes", text: "Schedule sessions, track attendance, and share recordings." },
  { icon: "🏆", title: "Certificates", text: "Auto-issued certificates the moment a course is completed." },
  { icon: "💬", title: "Discussions", text: "Per-course Q&A where teachers can pin the best answers." },
  { icon: "📊", title: "Progress Tracking", text: "Students and teachers both see real-time progress." },
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
          Learn, teach, and track progress — all in one place
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-400">
          A complete learning management platform with courses, quizzes, assignments, live
          classes, and certificates — built for students and teachers alike.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            Create free account
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
