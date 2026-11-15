import type { MetadataRoute } from "next";

// The site is not indexed yet. Every crawler is disallowed from every path. The noindex meta tag in
// src/app/layout.tsx is the second layer. Lift both only on the owner's decision.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
