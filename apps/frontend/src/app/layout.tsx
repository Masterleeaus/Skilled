import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  applicationName: "SkilledAt.Work",
  title: {
    default: "Skilled | SkilledAt.Work",
    template: "%s | Skilled",
  },
  description: "Build practical skills for work with SkilledAt.Work — training, pathways and verified learning progress.",
  icons: {
    icon: "/academy/skilled-mark.svg",
    shortcut: "/academy/skilled-mark.svg",
    apple: "/academy/skilled-mark.svg",
  },
  openGraph: {
    title: "SkilledAt.Work",
    description: "Practical learning and skills development for work.",
    siteName: "SkilledAt.Work",
    type: "website",
  },
};

const noFlashScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var preferred = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    if (preferred === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the inline script above may add the "light" class before hydration, so the
    // server markup and client attributes on <html> can differ by design. It only silences that attribute check.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
