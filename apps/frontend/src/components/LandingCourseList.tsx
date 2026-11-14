import type { CourseListItem } from "@/lib/course.api";
import { CourseCard } from "@/components/CourseCard";

interface LandingCourseListProps {
  courses: CourseListItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Published courses for the landing page. Renders one of four states: loading, error (with retry),
 * empty (nothing published yet) or the course cards.
 */
export function LandingCourseList({ courses, isLoading, isError, onRetry }: LandingCourseListProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-neutral-400">
        Loading courses...
      </p>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-neutral-300">We could not load courses right now.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-neutral-700 px-4 py-1.5 text-sm hover:bg-neutral-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return <p className="text-neutral-400">No courses are published yet. Check back soon.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
