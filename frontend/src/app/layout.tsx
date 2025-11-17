import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FontLoader from "@/components/shared/font-loader";
import DevToolsErrorSuppressor from "@/components/shared/devtools-error-suppressor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Jersey 25 字体 - 使用 Next.js 字体优化
// 注意：如果 next/font/google 不支持此字体，将使用 CSS 导入

export const metadata: Metadata = {
  title: "Nekovccat web work",
  description: "基于 Next.js 的 Nekovccat 网站",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nekovccat.origin.kim'),
  other: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DevToolsErrorSuppressor />
        <FontLoader />
        <main className="min-h-screen bg-white flex flex-col">
          <div className="flex-1 relative">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
