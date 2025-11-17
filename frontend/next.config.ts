import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境配置
  output: 'standalone', // 用于 Docker 部署的独立输出
  poweredByHeader: false, // 移除 X-Powered-By 响应头（安全最佳实践）
  
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nekovccat.origin.kim',
      },
    ],
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://nekovccat.origin.kim',
  },
  
};

export default nextConfig;
