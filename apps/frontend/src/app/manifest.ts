import type { MetadataRoute } from "next";

// Colours mirror the :root token in src/app/globals.css (dark is the default theme).
// The app has no basePath, so start_url and scope are the root of the deployed origin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SkilledAt.Work",
    short_name: "Skilled",
    description: "SkilledAt.Work workplace training, assessed practical evidence and learning pathways for field and home-service businesses",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    // Original Skilled application artwork retained from the consolidation branch.
    icons: [
      { src: "/academy/skilled-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/academy/skilled-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/academy/skilled-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
