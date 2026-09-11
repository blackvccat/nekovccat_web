import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import DevToolsErrorSuppressor from "@/components/shared/devtools-error-suppressor";
import { MusicSessionProvider } from "@/components/music/music-session";
import SiteMusic from "@/components/music/site-music";
import { AgentSessionProvider } from "@/components/agent/agent-session";
import { RelationshipModeProvider } from "@/components/relationship/relationship-mode";

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
  title: "Nekovccat web work",
  description: "基于 Next.js 的 Nekovccat 网站",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://origin.kim'),
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
        <MusicSessionProvider>
        <RelationshipModeProvider>
        <AgentSessionProvider>
        <main className="min-h-screen bg-white flex flex-col">
          <div className="flex-1 relative">
            {children}
          </div>
        </main>
        <SiteMusic />
        </AgentSessionProvider>
        </RelationshipModeProvider>
        </MusicSessionProvider>
      </body>
    </html>
  );
}
