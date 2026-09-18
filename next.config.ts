import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["192.168.1.42", "localhost:3000", "192.168.1.42:3000"],
};

export default nextConfig;
