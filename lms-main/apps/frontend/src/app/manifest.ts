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
    // Icons are intentionally not declared yet: no Skilled mark (192 and 512 px PNG) exists in the repository.
    // Add them under public/icons/ and list them here; scripts/verify-metadata.mjs fails until they are present.
    icons: [],
  };
}
