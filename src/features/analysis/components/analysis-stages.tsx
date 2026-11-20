import type { AnalysisSnapshot } from "@/types/analysis";
import { Icon } from "@/components/ui";
import { ANALYSIS_STAGES } from "../data/stages";

export function AnalysisStages({
  stage,
  complete,
  results,
  faceSummary,
}: {
  stage?: number;
  results?: AnalysisSnapshot["stageResults"];
  faceSummary?: string;
  complete: boolean;
}) {
  return (
    <ol aria-label="Analysis stages" className="flex flex-col gap-3">
      {ANALYSIS_STAGES.map((item, index) => {
        const done = complete || (stage !== undefined && index + 1 < stage);
        const active = !complete && index + 1 === stage;
        return (
          <li
            key={item.title}
            aria-current={active ? "step" : undefined}
            className={`relative flex gap-4 rounded-xl p-4 ${active ? "bg-surface-container-high shadow-lg shadow-black/40" : "bg-surface-container-low"}`}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-primary-container"
              />
            )}
            <span
              className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary-container text-on-primary-fixed" : active ? "bg-primary-container/20 text-primary-fixed" : "bg-surface-container-highest text-on-surface-variant"}`}
            >
              <Icon
                name={done ? "check" : active ? "spinner" : "clock"}
                size={18}
                className={active ? "motion-safe:animate-spin" : ""}
              />
              <span className="sr-only">
                {done ? "Completed" : active ? "In progress" : "Pending"}:
              </span>
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2
                  className={`text-body-lg ${active ? "font-bold text-primary" : done ? "font-semibold text-on-surface" : "font-medium text-on-surface-variant"}`}
                >
                  {item.title}
                </h2>
                <span
                  className={`shrink-0 rounded-sm px-2 py-0.5 text-label-sm ${active ? "bg-surface-container-lowest text-primary-fixed" : done ? "bg-surface-container-high text-primary-fixed" : "text-on-surface-variant"}`}
                >
                  {done
                    ? (results?.[(index + 1) as 1 | 2 | 3 | 4] ?? "Complete")
                    : active
                      ? `Stage ${stage}/4`
                      : "Pending"}
                </span>
              </div>
              <p
                className={`text-body-sm leading-relaxed ${active ? "text-on-surface" : "text-on-surface-variant"}`}
              >
                {item.description}
              </p>
              {index === 2 && (
                <p className="flex items-start gap-2 pt-1 text-label-sm text-on-surface-variant">
                  <Icon
                    name="frame"
                    size={15}
                    className="shrink-0 text-tertiary-fixed-dim"
                  />
                  <span>
                    Face detection bounding boxes:{" "}
                    <strong className="text-on-surface">
                      {faceSummary ?? "Awaiting detection"}
                    </strong>
                  </span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
