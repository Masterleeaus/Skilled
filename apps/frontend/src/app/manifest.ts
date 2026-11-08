import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SkilledAt.Work",
    short_name: "Skilled",
    description: "Practical learning and skills development for work.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/academy/skilled-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/academy/skilled-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/academy/skilled-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
