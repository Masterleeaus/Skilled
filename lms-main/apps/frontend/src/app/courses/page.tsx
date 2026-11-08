"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { fetchCourses } from "@/lib/course.api";
import { Topbar } from "@/components/Topbar";
import { BrandImage } from "@/components/BrandImage";
import { getBrand } from "@/lib/academy-brand";

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
      <main className="mx-auto max-w-5xl px-6 py-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="mb-6 w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />

        {isLoading && <p className="text-neutral-400">Loading courses...</p>}
        {data?.data.length === 0 && <p className="text-neutral-400">No courses found.</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((course) => {
            const brand = getBrand(course.slug);
            return (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="block rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
            >
              {brand && (
                <BrandImage
                  sources={[brand.thumb, brand.icon]}
                  alt={course.title}
                  width={400}
                  height={225}
                  className="mb-3 h-36 w-full rounded-lg object-cover"
                />
              )}
              <h3 className="font-medium">{course.title}</h3>
              <p className="mt-1 text-sm text-neutral-400">by {course.teacher.fullName}</p>
              <p className="mt-1 text-xs text-neutral-500">{course.category.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {Number(course.price) === 0 ? "Free" : `$${course.price}`}
                </span>
                <span className="text-xs text-neutral-500">{course._count.enrollments} enrolled</span>
              </div>
            </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
