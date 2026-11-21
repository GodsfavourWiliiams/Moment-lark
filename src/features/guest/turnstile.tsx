"use client";
import { useEffect, useRef, useState } from "react";
type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: string;
      size: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      "timeout-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
let scriptPromise: Promise<TurnstileApi> | undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise)
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error("Verification timed out"));
      }, 15000);
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        if (window.turnstile) resolve(window.turnstile);
        else {
          script.remove();
          reject(new Error("Verification unavailable"));
        }
      };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error("Verification failed to load"));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      scriptPromise = undefined;
      throw error;
    });
  return scriptPromise;
}
export function GuestVerification({
  siteKey,
  action,
  onVerified,
}: {
  siteKey: string;
  action: string;
  onVerified: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let active = true;
    let id: string | undefined;
    let api: TurnstileApi | undefined;
    void loadTurnstile()
      .then((value) => {
        if (!active || !container.current) return;
        api = value;
        const fail = () => {
          if (active) setError(true);
        };
        id = api.render(container.current, {
          sitekey: siteKey,
          action,
          theme: "dark",
          size: "flexible",
          callback: (token) => {
            if (active) onVerified(token);
          },
          "error-callback": fail,
          "expired-callback": fail,
          "timeout-callback": fail,
        });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      if (id !== undefined) api?.remove(id);
    };
  }, [siteKey, action, onVerified, attempt]);
  return (
    <div className="flex w-full flex-col gap-2" aria-label="Guest verification">
      <p>Verify to start your guest session.</p>
      <div ref={container} className="min-h-16 w-full max-w-sm" />
      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-2">
          <span>Verification expired or could not load.</span>
          <button
            type="button"
            className="text-primary-fixed underline"
            onClick={() => {
              setError(false);
              retry((value) => value + 1);
            }}
          >
            Retry verification
          </button>
        </div>
      )}
    </div>
  );
}
