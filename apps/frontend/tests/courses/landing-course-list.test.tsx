import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingCourseList } from "@/components/LandingCourseList";
import type { CourseListItem } from "@/lib/course.api";

const course: CourseListItem = {
  id: "course_1",
  title: "Safe Ladder Use",
  slug: "safe-ladder-use",
  thumbnailUrl: null,
  price: "0",
  isPublished: true,
  category: { name: "Safety" },
  teacher: { fullName: "Test Teacher" },
  _count: { enrollments: 4, reviews: 0 },
};

const noop = () => {};

describe("LandingCourseList", () => {
  it("shows an empty-state message and no course cards when nothing is published", () => {
    const html = renderToStaticMarkup(
      <LandingCourseList courses={[]} isLoading={false} isError={false} onRetry={noop} />,
    );

    expect(html).toContain("No courses are published yet. Check back soon.");
    expect(html).not.toContain("<h3");
    expect(html).not.toContain('href="/courses/');
  });

  it("renders one linked card per published course", () => {
    const second: CourseListItem = { ...course, id: "course_2", title: "Fire Extinguisher Basics", slug: "fire-basics", price: "49.00" };

    const html = renderToStaticMarkup(
      <LandingCourseList courses={[course, second]} isLoading={false} isError={false} onRetry={noop} />,
    );

    expect(html).not.toContain("No courses are published yet.");
    expect(html.match(/<h3/g)).toHaveLength(2);
    expect(html).toContain('href="/courses/safe-ladder-use"');
    expect(html).toContain('href="/courses/fire-basics"');
    expect(html).toContain("Safe Ladder Use");
    expect(html).toContain("by Test Teacher");
    expect(html).toContain("Free");
    expect(html).toContain("$49.00");
    expect(html).toContain("4 enrolled");
  });

  it("shows a loading message instead of the empty state while courses are fetched", () => {
    const html = renderToStaticMarkup(
      <LandingCourseList courses={undefined} isLoading={true} isError={false} onRetry={noop} />,
    );

    expect(html).toContain("Loading courses...");
    expect(html).not.toContain("No courses are published yet.");
  });

  it("shows an error message with a retry button when the request fails", () => {
    const html = renderToStaticMarkup(
      <LandingCourseList courses={undefined} isLoading={false} isError={true} onRetry={noop} />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("We could not load courses right now.");
    expect(html).toContain("Try again");
    expect(html).not.toContain("No courses are published yet.");
  });

  it("calls onRetry when the retry button is activated", () => {
    const onRetry = vi.fn();
    const element = LandingCourseList({ courses: undefined, isLoading: false, isError: true, onRetry });

    const button = findFirst(element, (node) => node.type === "button");
    expect(button).toBeDefined();
    (button!.props.onClick as () => void)();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

type ElementLike = { type: unknown; props: Record<string, unknown> };

/** Walks a React element tree and returns the first element matching the predicate. */
function findFirst(node: unknown, predicate: (element: ElementLike) => boolean): ElementLike | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findFirst(child, predicate);
      if (found) return found;
    }
    return undefined;
  }
  if (!node || typeof node !== "object" || !("props" in node)) return undefined;
  const element = node as ElementLike;
  if (predicate(element)) return element;
  return findFirst(element.props.children, predicate);
}
