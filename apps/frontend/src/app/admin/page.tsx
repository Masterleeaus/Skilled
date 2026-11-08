"use client";

import { useQuery } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchDashboardMetrics } from "@/lib/admin.api";
import { Topbar } from "@/components/Topbar";
import { AdminNav } from "@/components/AdminNav";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useRequireAuth(["ADMIN"]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboardMetrics,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="Admin Dashboard" />
      <AdminNav />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {isLoading && <p className="text-neutral-400">Loading metrics...</p>}

        {data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Revenue" value={`$${data.totalRevenue.toFixed(2)}`} />
            <MetricCard label="Monthly Revenue" value={`$${data.monthlyRevenue.toFixed(2)}`} />
            <MetricCard label="Active Students" value={data.activeStudents} />
            <MetricCard label="Active Teachers" value={data.activeTeachers} />
            <MetricCard label="Published Courses" value={data.publishedCourses} />
            <MetricCard label="Completion Rate" value={`${data.courseCompletionRate}%`} />
            <MetricCard label="Avg Quiz Score" value={`${data.averageQuizScore}%`} />
          </div>
        )}
      </main>
    </div>
  );
}
