import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep framework upgrades from generating project instruction files.
  agentRules: false,
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nekovccat.origin.kim',
      },
    ],
  },
  
  poweredByHeader: false, // 移除 X-Powered-By 响应头（安全最佳实践）

  async headers() {
    const production = process.env.NODE_ENV === 'production'
    const csp = [
      "default-src 'self'", `script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
      "connect-src 'self'", "frame-src https://music.163.com https://open.spotify.com",
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
      ...(production ? ['upgrade-insecure-requests'] : []),
    ].join('; ')
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp }, { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(production ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
    ] }]
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://neko.origin.kim',
  },
};

export default nextConfig;
