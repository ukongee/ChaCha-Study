import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["unpdf", "mupdf"],
};

export default nextConfig;
