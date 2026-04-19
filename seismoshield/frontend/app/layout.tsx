import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";

import { EmergencyModal } from "@/components/EmergencyModal";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1A56DB",
};

export const metadata: Metadata = {
  title: "SeismoShield",
  description:
    "Earthquake risk assessment for buildings — demo: UCSD Recreation Center.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SeismoShield",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="min-h-screen bg-[#0F172A] text-white antialiased">
        <EmergencyModal />
        {children}
      </body>
    </html>
  );
}
