import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipFlow | Local Video Studio",
  description:
    "ClipFlow — a local video studio. Turn raw recordings into clips on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
