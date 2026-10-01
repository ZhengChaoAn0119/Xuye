import type { MetadataRoute } from "next";

// The sitemap (absolute URLs) is added in phase 5 once the public domain is chosen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
  };
}
