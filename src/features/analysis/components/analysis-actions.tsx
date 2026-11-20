import { Button, Icon } from "@/components/ui";

export function AnalysisActions({
  complete,
  onCancel,
  onContinue,
}: {
  complete: boolean;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="-mx-6 -mb-6 flex flex-col-reverse items-center justify-between gap-4 rounded-b-xl bg-surface-container-low p-6 sm:-mx-8 sm:-mb-8 sm:flex-row">
      <Button
        onClick={onCancel}
        className="w-full shrink-0 text-on-surface-variant sm:w-auto"
      >
        <Icon name="close" size={18} />
        {complete ? "Back to Import" : "Cancel Analysis"}
      </Button>
      <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
        <span className="hidden items-center gap-2 text-body-sm text-on-surface-variant lg:inline-flex">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full bg-primary-container ${complete ? "" : "motion-safe:animate-pulse"}`}
          />
          {complete ? "Preview complete" : "Preparing suggestions"}
        </span>
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={!complete}
          aria-describedby="analysis-demo-notice"
          aria-haspopup="dialog"
          className="group w-full px-6 font-bold sm:w-auto"
        >
          <span>
            {complete
              ? "Proceed to Suggestions"
              : "Proceed to Suggestions (When Ready)"}
          </span>
          <Icon name="arrow" size={20} className="shrink-0" />
        </Button>
      </div>
    </div>
  );
}
