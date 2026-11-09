"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { logout as logoutApi } from "@/lib/auth.api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const homeHref = user?.role === "ADMIN" ? "/admin" : user?.role === "TEACHER" ? "/teacher" : "/student";

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
      <div className="flex items-center gap-4">
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
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      <div ref={menuRef} className="relative flex items-center gap-4 text-sm text-neutral-400">
        <ThemeToggle />

        <Link href={homeHref} className="hover:text-neutral-200">
          Dashboard
        </Link>

        <button onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-haspopup="true" aria-controls="account-menu" aria-label="Account menu" className="hover:text-neutral-200">
          {user?.fullName} ▾
        </button>

        {menuOpen && (
          <div id="account-menu" aria-label="Account options" className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-lg">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
            >
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
