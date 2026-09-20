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

/* 首屏之前先把明暗定下来。设置存在 localStorage，等 React 挂载再切的话，
   暗色用户每次进桌面都会先看到一屏米白再跳成暗色。这段脚本在桌面标记之前解析执行，
   所以第一次绘制就已是正确的主题；挂载后由 pixel-desktop 的 effect 继续跟随切换。
   它只读一个字段、只写一个属性，失败就退回亮色。

   放在**服务端**的根布局里，而不是 terminal/page.tsx（客户端组件）：客户端组件重渲染
   （Fast Refresh、站内跳转）会让 React 在浏览器里重新创建这个 <script> 元素并报错。
   根布局是 Server Component，客户端正常情况下不会重建它，所以不会有这个错误。 */
const THEME_BOOT = `try{var s=JSON.parse(localStorage.getItem('marcus-desktop-settings')||'null');document.documentElement.dataset.theme=s&&s.theme==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    // 桌面的明暗由一个首屏引导脚本写在 <html data-theme> 上（就是上面那条 THEME_BOOT），
    // 那发生在 React  hydrate 之前，所以这里必须允许该属性与客户端渲染结果不同，
    // 否则 React 会报「属性不匹配」并可能把主题属性抹掉。除 lang 与 data-theme 外没有别的属性。
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
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
