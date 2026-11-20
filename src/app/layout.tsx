import type { Metadata } from "next";
import { WorkflowGuard } from "@/components/layout/workflow-guard";
import { StudioHeader } from "@/components/layout/studio-header";
import { StudioDialogs } from "@/components/layout/studio-dialogs";
import { StudioProvider } from "@/components/providers/studio-provider";
import { EditingProvider } from "@/components/providers/editing-provider";
import { ExportProvider } from "@/components/providers/export-provider";
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
        <EditingProvider>
          <StudioProvider>
            <ExportProvider>
              <StudioHeader />
              <main
                id="main-content"
                tabIndex={-1}
                className="min-h-[calc(100dvh-4rem)] scroll-mt-32 bg-surface focus:outline-none xl:min-h-0 xl:scroll-mt-16"
              >
                <WorkflowGuard>{children}</WorkflowGuard>
              </main>
              <StudioDialogs />
            </ExportProvider>
          </StudioProvider>
        </EditingProvider>
      </body>
    </html>
  );
}
