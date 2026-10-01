import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  // Public pages are cached with `use cache` + cacheTag; chapter text stays request-time.
  cacheComponents: true,
  typedRoutes: true,
  poweredByHeader: false,
};

export default nextConfig;
