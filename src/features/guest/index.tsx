"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { GuestVerification } from "./turnstile";
import { useGuest } from "@/hooks/use-guest";

export function GuestAllowance({
  onReady,
}: { onReady?: (ready: boolean) => void } = {}) {
  const { state, retry, verify } = useGuest();
  const ready =
    state.status === "ready" && state.usage.allowance.remainingVideos > 0;
  useEffect(() => {
    onReady?.(ready);
  }, [ready, onReady]);

  return (
    <section
      aria-label="Guest analysis allowance"
      className="flex flex-wrap items-center justify-between gap-space-sm rounded-lg bg-surface-container-low px-space-md py-space-sm text-body-sm text-on-surface-variant"
    >
      <div role="status" aria-live="polite" aria-atomic="true">
        {state.status === "loading" && <span>Checking guest allowance…</span>}
        {state.status === "unavailable" && (
          <span>
            Guest analysis is not available yet. Your video stays on this
            device.
          </span>
        )}
        {state.status === "error" && <span>{state.message}</span>}
        {state.status === "ready" && (
          <>
            <span className="font-semibold text-on-surface">Guest</span>{" "}
            <span aria-hidden="true">·</span>{" "}
            <span className="text-primary-fixed">
              {state.usage.allowance.remainingVideos}{" "}
              {state.usage.allowance.remainingVideos === 1 ? "video" : "videos"}{" "}
              available
            </span>{" "}
            <span className="ml-space-sm">
              of {state.usage.allowance.grantedVideos} total
            </span>
          </>
        )}
      </div>
      {state.status === "challenge" && (
        <GuestVerification
          siteKey={state.siteKey}
          action={state.action}
          onVerified={verify}
        />
      )}
      {state.status === "ready" && (
        <span className="rounded bg-surface-container-high px-2 py-1 text-label-sm">
          {state.usage.mode === "local-development"
            ? "Local test allowance"
            : "Guest allowance"}
        </span>
      )}
      {state.status === "error" && (
        <Button onClick={retry} className="px-space-sm py-1 text-label-sm">
          Retry guest session
        </Button>
      )}
    </section>
  );
}
