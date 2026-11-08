import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  applicationName: "SkilledAt.Work",
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  manifest: "/manifest.webmanifest",
  title: {
    default: "Skilled | SkilledAt.Work",
    template: "%s | Skilled",
  },
  description: "Build practical skills for work with SkilledAt.Work — training, pathways and verified learning progress.",
  icons: {
    icon: "/academy/skilled-mark.svg",
    shortcut: "/academy/skilled-mark.svg",
    apple: "/academy/skilled-apple-touch.png",
  },
  openGraph: {
    title: "SkilledAt.Work",
    description: "Practical learning and skills development for work.",
    siteName: "SkilledAt.Work",
    type: "website",
    images: [{
      url: "/academy/skilled-open-graph.png",
      width: 1200,
      height: 630,
      alt: "SkilledAt.Work — practical skills for work",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkilledAt.Work",
    description: "Practical learning and skills development for work.",
    images: ["/academy/skilled-open-graph.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark light",
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
