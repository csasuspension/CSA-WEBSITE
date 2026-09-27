import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSA High Performance Suspension",
  description: "โช้คอัพและช่วงล่างสมรรถนะสูงสำหรับรถตู้ พร้อมบริการรับประกันและค้นหาตัวแทนจำหน่าย CSA",
  icons: {
    icon: [
      { url: "/csa-favicon-v13-48.png", type: "image/png", sizes: "48x48" },
      { url: "/csa-favicon-v13-96.png", type: "image/png", sizes: "96x96" },
      { url: "/csa-icon-v12-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/csa-apple-touch-v12.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
