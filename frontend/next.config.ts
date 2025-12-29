import type { NextConfig } from "next";

// 检测是否为 GitHub Pages 部署
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  // 生产环境配置
  // GitHub Pages 需要静态导出，其他情况使用 standalone
  output: isGitHubPages ? 'export' : 'standalone',
  
  // GitHub Pages 需要设置 basePath 和 assetPrefix
  ...(isGitHubPages && {
    basePath: process.env.BASE_PATH || '/nekovccat_web',
    assetPrefix: process.env.ASSET_PREFIX || '/nekovccat_web',
    images: {
      unoptimized: true, // GitHub Pages 不支持 Next.js 图片优化
    },
  }),
  
  // 非 GitHub Pages 的图片优化配置
  ...(!isGitHubPages && {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'nekovccat.origin.kim',
        },
      ],
    },
  }),
  
  poweredByHeader: false, // 移除 X-Powered-By 响应头（安全最佳实践）

  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://nekovccat.origin.kim',
  },
  
  // 静态导出配置
  ...(isGitHubPages && {
    trailingSlash: true,
  }),
};

export default nextConfig;
