"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { STUDIO_NAVIGATION } from "@/config/navigation";
import { useWorkflow } from "@/hooks/use-workflow";

export function WorkflowGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const workflow = useWorkflow();
  const section = STUDIO_NAVIGATION.find((item) => item.href === pathname);
  const allowed = !section || workflow.canOpen(section.id);
  useEffect(() => {
    if (!allowed) router.replace(workflow.fallback);
  }, [allowed, router, workflow.fallback]);
  if (!allowed)
    return (
      <p role="status" className="p-6 text-on-surface-variant">
        Returning to your current workflow step…
      </p>
    );
  return children;
}
