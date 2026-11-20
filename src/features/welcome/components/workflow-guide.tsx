import { Icon } from "@/components/ui";
import { workflowSteps } from "../data/workflow";

export function WorkflowGuide() {
  return (
    <section aria-labelledby="workflow-heading" className="pt-space-md">
      <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
        <h2
          id="workflow-heading"
          className="text-headline-md font-bold text-primary"
        >
          High-Velocity Architecture
        </h2>
        <span className="font-code text-label-sm text-on-surface-variant">
          DESKTOP POST PIPELINE
        </span>
      </div>
      <ol className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {workflowSteps.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col rounded-xl bg-surface-container-low p-space-md"
          >
            <div className="mb-space-sm flex items-center justify-between">
              <span
                aria-hidden="true"
                className="font-code text-headline-md font-bold text-primary-container"
              >
                0{index + 1}
              </span>
              <Icon name={step.icon} className="text-on-surface-variant" />
            </div>
            <h3 className="mb-1 text-label-md font-semibold text-primary">
              {step.title}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
