import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MomentLark | Find the moments worth sharing",
  description: "A local-first workspace for finding and refining video clips.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
