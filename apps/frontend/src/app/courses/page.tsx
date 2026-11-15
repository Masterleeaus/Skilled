"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { fetchCourses } from "@/lib/course.api";
import { Topbar } from "@/components/Topbar";
import { CourseCard } from "@/components/CourseCard";

export default function BrowseCoursesPage() {
  useAuthStore();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["browse-courses", search],
    queryFn: () => fetchCourses({ published: "true", search: search || undefined, limit: "50" }),
  });

  return (
    <div>
      <Topbar title="Browse Courses" />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-8">
        <input
          type="search"
          aria-label="Search courses"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="mb-6 w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />

        {isLoading && <p className="text-neutral-400">Loading courses...</p>}
        {data?.data.length === 0 && <p className="text-neutral-400">No courses found.</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </main>
    </div>
  );
}
