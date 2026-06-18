import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["subtle-notify-driven-competitive.trycloudflare.com", "*.trycloudflare.com"],
  typescript: { ignoreBuildErrors: true },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy",
  },
};

export default nextConfig;




