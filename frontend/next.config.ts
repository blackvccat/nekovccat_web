import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep framework upgrades from generating project instruction files.
  agentRules: false,
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
  },
  
  poweredByHeader: false, // 移除 X-Powered-By 响应头（安全最佳实践）

  // 服务端产物默认带 64 个 .map：它们不在 /_next/static 下、URL 拿不到，
  // 但会**随发布包一起上传**（打包的是整个 .next/standalone），等于把服务端源码不必要地放进发布物。
  // 关掉之后服务器上的堆栈只剩压缩后的名字，站点日志本来也只记固定字段，代价可忽略。
  experimental: { serverSourceMaps: false },

  // 桌面在 /terminal。域名根路径留给主站，所以这里不接管 '/'，只跳转站点自己的旧地址；
  // 查询参数原样带到桌面。
  async redirects() {
    return [
      { source: '/my-world', destination: '/terminal', permanent: false },
      { source: '/about', destination: '/terminal?app=explorer&tab=about', permanent: false },
      { source: '/contact', destination: '/terminal?app=explorer&tab=contact', permanent: false },
    ]
  },

  async headers() {
    const production = process.env.NODE_ENV === 'production'
    const csp = [
      "default-src 'self'", `script-src 'self' 'unsafe-inline'${production ? '' : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
      "connect-src 'self'", "frame-src 'self' https:",
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'",
      ...(production ? ['upgrade-insecure-requests'] : []),
    ].join('; ')
    return [{
      // 夜泊壁纸的素材名里带内容哈希：内容一改文件名就跟着变，所以可以让浏览器直接长期缓存。
      // 清单（manifest）也要缓存，否则每次进桌面都会再问一次后端要 8KB。
      source: '/images/marcus-night-harbor/:asset((?:wallpaper|mobile|thumbnail|ambience|manifest)-[a-f0-9]{12}\\.(?:webp|json))',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }, { source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: csp }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(production ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
    ] }]
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://example.com/terminal',
  },
};

export default nextConfig;
