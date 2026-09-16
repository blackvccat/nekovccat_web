import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import DevToolsErrorSuppressor from "@/components/shared/devtools-error-suppressor";
import { MusicSessionProvider } from "@/components/music/music-session";
import SiteMusic from "@/components/music/site-music";
import { AgentSessionProvider } from "@/components/agent/agent-session";
import { VisitorModeProvider } from "@/components/visitor/visitor-mode";

const geistSans = localFont({
  src: "../../public/fonts/geist-latin-wght-normal.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

const geistMono = localFont({
  src: "../../public/fonts/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marcus | Terminal",
  description: "基于 Next.js 的 Marcus 个人网站",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://example.com/terminal'),
  other: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    // 桌面的明暗由一个首屏引导脚本写在 <html data-theme> 上（terminal/page.tsx 里的 THEME_BOOT），
    // 那发生在 React  hydrate 之前，所以这里必须允许该属性与客户端渲染结果不同，
    // 否则 React 会报「属性不匹配」并可能把主题属性抹掉。除 lang 与 data-theme 外没有别的属性。
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DevToolsErrorSuppressor />
        <MusicSessionProvider>
        <VisitorModeProvider>
        <AgentSessionProvider>
        <main className="min-h-screen bg-white flex flex-col">
          <div className="flex-1 relative">
            {children}
          </div>
        </main>
        <SiteMusic />
        </AgentSessionProvider>
        </VisitorModeProvider>
        </MusicSessionProvider>
      </body>
    </html>
  );
}
