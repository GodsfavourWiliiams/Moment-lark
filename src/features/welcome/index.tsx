"use client";

import { useStudio } from "@/hooks/use-studio";
import { AnalysisView } from "@/features/analysis";
import { ImportDropzone } from "./components/import-dropzone";
import { PrivacyCard } from "./components/privacy-card";
import { useEditingSession } from "@/hooks/use-editing";
import { ShortcutRibbon } from "./components/shortcut-ribbon";
import { WelcomeIntro } from "./components/welcome-intro";
import { WorkflowGuide } from "./components/workflow-guide";
import { GuestAllowance } from "@/features/guest";

export function WelcomePage() {
  const studio = useStudio();
  const editing = useEditingSession();
  if (studio.view === "analysis" && studio.selectedVideo)
    return (
      <AnalysisView
        video={studio.selectedVideo}
        source={studio.reading ? null : (editing.document?.source ?? null)}
        reading={studio.reading}
        error={studio.error}
        complete={editing.reached.suggestions}
        onCancel={studio.returnToImport}
      />
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-space-xl px-space-lg py-space-xl">
      <WelcomeIntro />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-space-xl">
        <GuestAllowance />
        <ImportDropzone
          onBrowse={studio.openPicker}
          onFiles={studio.selectFiles}
          error={studio.error}
        />
        <PrivacyCard />
        <WorkflowGuide />
        <ShortcutRibbon />
      </div>
    </div>
  );
}
