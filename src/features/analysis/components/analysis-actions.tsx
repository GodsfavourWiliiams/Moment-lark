import { Button, Icon } from "@/components/ui";

export function AnalysisActions({
  complete,
  onCancel,
}: {
  complete: boolean;
  onCancel: () => void;
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
      <span className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-primary-container"
        />
        {complete ? "Opening Suggestions…" : "Auto-advancing on complete"}
      </span>
    </div>
  );
}
