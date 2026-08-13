import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keep tracing rooted at this package (workspace has other lockfiles).
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
