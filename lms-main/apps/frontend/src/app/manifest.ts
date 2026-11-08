import type { MetadataRoute } from "next";

// Colours mirror the :root token in src/app/globals.css (dark is the default theme).
// The app has no basePath, so start_url and scope are the root of the deployed origin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SkilledAt.Work",
    short_name: "Skilled",
    description: "SkilledAt.Work learning system: Titan Academy training for field and home-service businesses",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    // Placeholder text-only marks until the Skilled mark is supplied; see public/icons/README.md.
    icons: [
      { src: "/icons/icon-192-placeholder.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-placeholder.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
