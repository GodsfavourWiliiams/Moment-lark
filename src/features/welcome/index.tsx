"use client";

import { useStudio } from "@/hooks/use-studio";
import { AnalysisView } from "@/features/analysis";
import { ImportDropzone } from "./components/import-dropzone";
import { PrivacyCard } from "./components/privacy-card";
import { SampleCard } from "./components/sample-card";
import { ShortcutRibbon } from "./components/shortcut-ribbon";
import { WelcomeIntro } from "./components/welcome-intro";
import { WorkflowGuide } from "./components/workflow-guide";

export function WelcomePage() {
  const studio = useStudio();
  if (studio.view === "analysis" && studio.selectedVideo)
    return (
      <AnalysisView
        video={studio.selectedVideo}
        progress={studio.progress}
        onCancel={studio.returnToImport}
        onContinue={() => studio.openSection("suggestions")}
      />
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-xl px-space-lg py-space-xl">
      <WelcomeIntro />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-xl">
        <ImportDropzone
          inputRef={studio.inputRef}
          onBrowse={studio.openPicker}
          onFiles={studio.selectFiles}
          error={studio.error}
        />
        <div className="-mt-space-xs grid grid-cols-1 gap-space-lg md:grid-cols-2">
          <PrivacyCard />
          <SampleCard onAnalyze={studio.startSample} />
        </div>
        <WorkflowGuide />
        <ShortcutRibbon />
      </div>
    </div>
  );
}
