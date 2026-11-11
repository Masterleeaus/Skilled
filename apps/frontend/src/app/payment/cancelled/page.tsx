import Link from "next/link";

export default function PaymentCancelledPage() {
  return (
    <main className="mx-auto max-w-xl space-y-5 p-8">
      <h1 className="text-2xl font-semibold">Checkout not completed</h1>
      <p>Your checkout was cancelled. No course access has been granted by this page.</p>
      <Link href="/courses" className="block underline">Return to courses</Link>
      <Link href="/student" className="block underline">My Courses</Link>
    </main>
  );
}
