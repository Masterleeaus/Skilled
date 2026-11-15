import Link from "next/link";
import { BrandImage } from "@/components/BrandImage";
import { getBrand } from "@/lib/academy-brand";
import type { CourseListItem } from "@/lib/course.api";

/** Link card for one published course. Shared by the browse page and the landing page. */
export function CourseCard({ course }: { course: CourseListItem }) {
  const brand = getBrand(course.slug);
  return (
    <Link
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
        <span className="text-sm font-medium">{Number(course.price) === 0 ? "Free" : `$${course.price}`}</span>
        <span className="text-xs text-neutral-500">{course._count.enrollments} enrolled</span>
      </div>
    </Link>
  );
}
