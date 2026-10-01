import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  // Public pages are cached with `use cache` + cacheTag; chapter text stays request-time.
  cacheComponents: true,
  cacheLife: {
    // Public catalog: short enough that scheduled chapters and CLI imports
    // (which cannot invalidate tags) appear within about a minute.
    catalog: { stale: 60, revalidate: 60, expire: 3600 },
  },
  typedRoutes: true,
  poweredByHeader: false,
};

export default nextConfig;
