import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone", // required for Docker multi-stage build
  allowedDevOrigins: ["172.27.16.1", "192.168.16.106", "192.168.16.108"],
}

export default nextConfig
