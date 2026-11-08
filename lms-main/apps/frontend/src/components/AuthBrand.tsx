import Link from "next/link";

/**
 * Shared account-flow identity. Keep it separate from auth state and token URLs.
 * Product naming stays consistent across sign-in, registration and recovery.
 */
export function AuthBrand() {
  return (
    <div className="text-center">
      <Link
        href="/"
        className="inline-flex items-center rounded-md px-2 py-1 text-lg font-semibold tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="SkilledAt.Work home"
      >
        SkilledAt.Work
      </Link>
      <p className="mt-1 text-xs text-neutral-400">Practical skills for field and home-service teams</p>
    </div>
  );
}
