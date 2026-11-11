"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, Settings, ClipboardCheck } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/courses", label: "Courses", Icon: BookOpen },
  { href: "/admin/business-context", label: "Lesson configuration", Icon: Settings },
  { href: "/admin/lesson-review", label: "Lesson review", Icon: ClipboardCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-4 gap-y-2 border-b border-neutral-800 px-6 py-3 text-sm">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={pathname === l.href ? "page" : undefined}
          className={`flex items-center gap-1.5 ${pathname === l.href ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          <l.Icon className="h-4 w-4" aria-hidden="true" />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
