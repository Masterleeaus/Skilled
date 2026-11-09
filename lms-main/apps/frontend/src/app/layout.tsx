import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

// Public origin of the deployment. Set NEXT_PUBLIC_SITE_URL at build time (for example https://<your-domain>).
// The default is a local placeholder, so no production domain is invented here.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = "SkilledAt.Work";
const siteDescription = "SkilledAt.Work learning system: Titan Academy training for field and home-service businesses";
// Placeholder text-only share image (public/icons/README.md), replaced when the Skilled mark is supplied.
const shareImage = { url: "/icons/og-image-placeholder.png", width: 1200, height: 630, alt: "SkilledAt.Work" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: siteName,
  description: siteDescription,
  appleWebApp: { capable: true, title: "Skilled" },
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description: siteDescription,
    url: "/",
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [shareImage.url],
  },
};

// Theme colours match the :root tokens in globals.css (dark) and :root.light (light).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-3 font-semibold text-neutral-900 shadow-lg focus:not-sr-only focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600">Skip to main content</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
