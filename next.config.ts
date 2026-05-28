import type { NextConfig } from "next"

// Content-Security-Policy notes:
// - script-src: 'unsafe-inline' needed for Next.js inline scripts; va.vercel-scripts.com for Analytics
// - style-src: 'unsafe-inline' needed for inline <style> tags used throughout the app
// - img-src: 'self' + data: (avatars/previews) + blob: (local image preview) + https: (external product images)
// - connect-src: Supabase REST + realtime (wss), Groq AI, Vercel Insights
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com https://va.vercel-scripts.com https://*.vercel-insights.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ")

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Content-Security-Policy", value: csp },
]

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  allowedDevOrigins: ["172.27.16.1", "192.168.16.106", "192.168.16.108"],
  images: {
    // Allow next/image to optimize images from Supabase Storage and common product CDNs.
    // Add more hostnames here as needed — never use a wildcard for untrusted domains.
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
    ],
    // Prefer WebP/AVIF for significant byte savings on product images
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
