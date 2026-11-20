import { Icon } from "@/components/ui";
export function DeviceProcessingNote() {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg bg-surface-container-lowest/90 px-space-md py-2 text-on-surface-variant sm:flex-row sm:items-center">
      <p className="flex items-center gap-2 text-body-sm">
        <Icon name="shield" size={18} className="shrink-0 text-primary-fixed" />
        Processing on this device using WebCodecs &amp; browser canvas
      </p>
      <span className="shrink-0 font-code text-label-sm text-primary-fixed">
        Zero Media Uploads
      </span>
    </div>
  );
}
