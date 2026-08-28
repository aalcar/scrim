import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Scenario and fixture files are read from disk at request time, so they have
  // to be traced into the serverless bundle explicitly.
  outputFileTracingIncludes: {
    "/**": ["./scenarios/**", "./fixtures/**"],
  },
};

export default nextConfig;
