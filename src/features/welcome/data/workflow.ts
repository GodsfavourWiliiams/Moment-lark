import type { IconName } from "@/components/ui";

type WorkflowStep = { title: string; description: string; icon: IconName };
export const workflowSteps: WorkflowStep[] = [
  {
    title: "Select Video",
    description:
      "Choose a local recording to start analysis. Your video stays on your device.",
    icon: "input",
  },
  {
    title: "Review & Edit",
    description:
      "Review suggested moments, keep the clips you want, and open the editor for adjustments. Resizing is optional.",
    icon: "sliders",
  },
  {
    title: "Batch Export",
    description:
      "Review your kept clips, then render and download them individually or together in a ZIP.",
    icon: "share",
  },
];
