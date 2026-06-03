import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Spraakmaker — Leer Nederlands",
  description: "Leer Nederlands op jouw manier",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Spraakmaker",
  },
  icons: {
    icon: "/spfavicon.png",
    apple: "/spfavicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1A1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}


