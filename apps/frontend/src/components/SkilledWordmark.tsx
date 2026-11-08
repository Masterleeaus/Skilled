import Link from "next/link";

interface SkilledWordmarkProps {
  href?: string;
  className?: string;
  compactOnMobile?: boolean;
}

export function SkilledWordmark({ href = "/", className = "", compactOnMobile = false }: SkilledWordmarkProps) {
  return (
    <Link
      href={href}
      aria-label="SkilledAt.Work home"
      className={`inline-flex items-center gap-2.5 text-neutral-100 ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-slate-950" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5h6.5A2.5 2.5 0 0 1 13 8v11H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path d="M20 5.5h-4.5A2.5 2.5 0 0 0 13 8v11h4.5A2.5 2.5 0 0 1 20 21V5.5Z" />
        </svg>
      </span>
      <span className={`${compactOnMobile ? "hidden sm:flex" : "flex"} flex-col leading-none`}>
        <span className="text-base font-bold tracking-tight">Skilled</span>
        <span className="mt-1 text-[10px] font-medium tracking-[0.16em] text-neutral-400">AT.WORK</span>
      </span>
    </Link>
  );
}
