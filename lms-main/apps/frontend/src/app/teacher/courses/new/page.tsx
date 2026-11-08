"use client";

import { apiErrorMessage } from "@/lib/api-error";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { fetchCategories, createCourse } from "@/lib/course-mutations.api";
import { Topbar } from "@/components/Topbar";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.string().min(1),
  price: z.coerce.number().min(0),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

type FormValues = z.infer<typeof schema>;

export default function NewCoursePage() {
  const { user } = useRequireAuth(["TEACHER", "ADMIN"]);
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: 0, level: "BEGINNER" },
  });

  const mutation = useMutation({
    mutationFn: createCourse,
    onSuccess: (course) => router.push(`/teacher/courses/${course.slug}`),
    onError: (err: unknown) => setServerError(apiErrorMessage(err) ?? "Failed to create course"),
  });

  if (!user) return null;

  return (
    <div>
      <Topbar title="New Course" backHref="/teacher" backLabel="My Courses" />

      <main className="mx-auto max-w-xl px-6 py-8">
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div>
            <label htmlFor="course-title" className="mb-1 block text-sm text-neutral-300">Title</label>
            <input
              id="course-title"
              {...register("title")}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="course-description" className="mb-1 block text-sm text-neutral-300">Description</label>
            <textarea
              id="course-description"
              {...register("description")}
              rows={4}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="course-category" className="mb-1 block text-sm text-neutral-300">Category</label>
            <select
              id="course-category"
              {...register("categoryId")}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            >
              <option value="">Select a category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-400">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="course-price" className="mb-1 block text-sm text-neutral-300">Price ($)</label>
              <input
                id="course-price"
                {...register("price")}
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label htmlFor="course-level" className="mb-1 block text-sm text-neutral-300">Level</label>
              <select
                id="course-level"
                {...register("level")}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-white py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
          >
            {mutation.isPending ? "Creating..." : "Create course"}
          </button>
        </form>
      </main>
    </div>
  );
}
