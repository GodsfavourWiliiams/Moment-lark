import type { Metadata } from "next";
import { StudioHeader } from "@/components/layout/studio-header";
import { StudioDialogs } from "@/components/layout/studio-dialogs";
import { StudioProvider } from "@/components/providers/studio-provider";
import { BRAND } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name} | Local Video Studio`,
  description:
    "Moment Lark — a local video studio. Turn raw recordings into clips on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <StudioProvider>
          <StudioHeader />
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-[calc(100dvh-4rem)] scroll-mt-32 bg-surface focus:outline-none xl:scroll-mt-16"
          >
            {children}
          </main>
          <StudioDialogs />
        </StudioProvider>
      </body>
    </html>
  );
}
