import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSA High Performance Suspension",
  description: "โช้คอัพและช่วงล่างสมรรถนะสูงสำหรับรถตู้ พร้อมบริการรับประกันและค้นหาตัวแทนจำหน่าย CSA",
  icons: {
    icon: "/csa-favicon-v10.svg",
    shortcut: "/csa-favicon-v10.svg",
    apple: "/csa-apple-touch-v10.png",
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
