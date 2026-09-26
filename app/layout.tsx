import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSA High Performance Suspension",
  description: "โช้คอัพและช่วงล่างสมรรถนะสูงสำหรับรถตู้ พร้อมบริการรับประกันและค้นหาตัวแทนจำหน่าย CSA",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
