"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { logout as logoutApi } from "@/lib/auth.api";
import { fetchAcademyMemberships } from "@/lib/curriculum.api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { dashboardHref } from "@/lib/dashboard-link";
import { roleNavLinks } from "@/lib/nav-links";

interface TopbarProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

export function Topbar({ title, backHref, backLabel = "Back" }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const memberships = useQuery({
    queryKey: ["academy-memberships"],
    queryFn: fetchAcademyMemberships,
    enabled: !!user,
    retry: false,
  });
  const navLinks = roleNavLinks(user, memberships.data ?? []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const homeHref = dashboardHref(user);

  async function handleLogout() {
    try {
      await logoutApi();
    } finally {
      logout();
      router.push("/login");
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-neutral-800 px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={homeHref ?? "/"} aria-label={homeHref ? "SkilledAt.Work dashboard" : "SkilledAt.Work home"} className="shrink-0 text-sm font-semibold tracking-tight text-neutral-100 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          SkilledAt.Work
        </Link>
        <span aria-hidden="true" className="h-5 w-px bg-neutral-700" />
        {backHref === "back" ? (
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />{backLabel}
          </button>
        ) : (
          backHref && (
            <Link href={backHref} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-200">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />{backLabel}
            </Link>
          )
        )}
        <h1 className="min-w-0 text-lg font-semibold">{title}</h1>
      </div>

      <div ref={menuRef} className="relative flex items-center gap-4 text-sm text-neutral-400">
        <ThemeToggle />

        {homeHref ? (
          <>
            <Link href={homeHref} className="hover:text-neutral-200">
              Dashboard
            </Link>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-neutral-200">
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls="skilled-account-menu"
              aria-label={`Account menu for ${user?.fullName ?? "user"}`}
              className="hover:text-neutral-200"
            >
              {user?.fullName} ▾
            </button>
            {menuOpen && (
              <div id="skilled-account-menu" role="menu" className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-lg">
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  My Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800"
                >
                  Log out
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-neutral-200">Log in</Link>
            <Link href="/register" className="rounded-md border border-neutral-700 px-3 py-1.5 text-neutral-100 hover:border-neutral-500">
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
