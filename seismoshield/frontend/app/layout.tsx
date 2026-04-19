import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";

import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1A56DB",
};

export const metadata: Metadata = {
  title: "Quarte",
  description:
    "Earthquake risk assessment for buildings — demo: UCSD Recreation Center.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quarte",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="flex min-h-screen flex-col bg-[#0F172A] text-white antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[#1A56DB] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content" className="flex flex-1 flex-col min-h-0">
          {children}
        </main>
      </body>
    </html>
  );
}
