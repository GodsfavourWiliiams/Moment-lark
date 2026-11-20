import type { IconName } from "@/components/ui";

type WorkflowStep = { title: string; description: string; icon: IconName };
export const workflowSteps: WorkflowStep[] = [
  {
    title: "Select Video",
    description:
      "Mount file descriptors into browser virtual memory with sub-frame timecode accuracy.",
    icon: "input",
  },
  {
    title: "Review & Edit",
    description:
      "Inspect silence markers, trim scene timestamps, and reframe horizontal footage into 9:16 vertical shorts.",
    icon: "sliders",
  },
  {
    title: "Batch Export",
    description:
      "Render selected sub-clips simultaneously using threaded canvas encoders directly to your download reel.",
    icon: "share",
  },
];
