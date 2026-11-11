import { SkilledWordmark } from "@/components/SkilledWordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute left-5 top-5 z-10 sm:left-8 sm:top-7">
        <SkilledWordmark />
      </div>
      {children}
    </div>
  );
}
