"use client";

import { StudioHeader } from "@/components/layout/studio-header";
import { useWelcome } from "@/hooks/use-welcome";
import { useWelcomeShortcuts } from "@/hooks/use-welcome-shortcuts";
import { ImportDropzone } from "./components/import-dropzone";
import { PrivacyCard } from "./components/privacy-card";
import { SampleCard } from "./components/sample-card";
import { ShortcutRibbon } from "./components/shortcut-ribbon";
import { WelcomeDialogs } from "./components/welcome-dialogs";
import { WelcomeIntro } from "./components/welcome-intro";
import { WorkflowGuide } from "./components/workflow-guide";

export function WelcomePage() {
  const welcome = useWelcome();
  useWelcomeShortcuts({
    openPicker: welcome.openPicker,
    openShortcuts: welcome.openShortcuts,
    dialogOpen: welcome.dialog !== null,
  });

  return (
    <>
      <StudioHeader
        onShortcuts={welcome.openShortcuts}
        onNavigate={welcome.openDialog}
      />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100dvh-4rem)] scroll-mt-32 bg-surface focus:outline-none md:scroll-mt-16"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-xl px-space-lg py-space-xl">
          <WelcomeIntro />
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-xl">
            <ImportDropzone
              inputRef={welcome.inputRef}
              onBrowse={welcome.openPicker}
              onFiles={welcome.selectFiles}
              selectedVideo={welcome.selectedVideo}
              error={welcome.error}
            />
            <div className="-mt-space-xs grid grid-cols-1 gap-space-lg md:grid-cols-2">
              <PrivacyCard />
              <SampleCard onAnalyze={() => welcome.openDialog("sample")} />
            </div>
            <WorkflowGuide />
            <ShortcutRibbon />
          </div>
        </div>
      </main>
      <WelcomeDialogs dialog={welcome.dialog} onClose={welcome.closeDialog} />
    </>
  );
}
