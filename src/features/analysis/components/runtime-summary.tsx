import { Icon } from "@/components/ui";
import { RUNTIME_PREVIEW } from "../data/preview";

export function RuntimeSummary() {
  return (
    <dl
      aria-label="Illustrative runtime metrics"
      className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4"
    >
      {RUNTIME_PREVIEW.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col gap-0.5 rounded-lg bg-surface-container-low p-3"
        >
          <dt className="font-code text-label-sm text-on-surface-variant uppercase">
            {label}
          </dt>
          <dd className="text-body-md font-semibold text-on-surface">
            {value}
          </dd>
        </div>
      ))}
      <div className="flex flex-col gap-0.5 rounded-lg bg-surface-container-low p-3">
        <dt className="font-code text-label-sm text-on-surface-variant uppercase">
          Privacy Assurance
        </dt>
        <dd className="flex items-center justify-center gap-1 text-body-md font-semibold text-primary-fixed">
          <Icon name="lock" size={16} className="shrink-0" />
          Air-gapped Ready
        </dd>
      </div>
    </dl>
  );
}
