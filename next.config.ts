import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load these server-only packages from node_modules at runtime instead of bundling them.
  // PGlite ships WebAssembly + data files that break when bundled, which leaves the
  // embedded database un-initialised (0 tables, login fails).
  serverExternalPackages: ["@electric-sql/pglite", "pg", "mongodb", "bcryptjs"],
};

export default nextConfig;
