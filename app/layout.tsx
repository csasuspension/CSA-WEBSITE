import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSA Member & Warranty",
  description: "CSA automotive parts, member, orders, warranty and claim portal.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
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
