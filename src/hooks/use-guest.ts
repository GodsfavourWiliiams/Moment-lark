"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  GuestApiError,
  loadGuestChallenge,
  loadGuestUsage,
} from "@/services/guest";
import { guestReducer } from "@/state/guest";

export function useGuest() {
  const [state, dispatch] = useReducer(guestReducer, { status: "loading" });
  const token = useRef<string | undefined>(undefined);
  const [attempt, retry] = useState(0);

  useEffect(() => {
    let active = true;
    const challengeToken = token.current;
    token.current = undefined;
    loadGuestUsage(challengeToken).then(
      (usage) => {
        if (active) dispatch({ type: "loaded", usage });
      },
      async (error: unknown) => {
        if (!active) return;
        if (
          error instanceof GuestApiError &&
          error.code === "challenge_required"
        ) {
          try {
            const challenge = await loadGuestChallenge();
            if (active) dispatch({ type: "challenge", ...challenge });
          } catch {
            if (active)
              dispatch({
                type: "failed",
                message: "Could not load verification. Please retry.",
              });
          }
          return;
        }
        if (
          error instanceof GuestApiError &&
          error.code === "guest_unavailable"
        ) {
          dispatch({ type: "unavailable" });
        } else {
          dispatch({
            type: "failed",
            message:
              error instanceof GuestApiError
                ? error.message
                : "Could not load your guest allowance. Check your connection and try again.",
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const verify = useCallback((value: string) => {
    token.current = value;
    dispatch({ type: "loading" });
    retry((value) => value + 1);
  }, []);
  return {
    state,
    verify,
    retry: () => {
      dispatch({ type: "loading" });
      retry((value) => value + 1);
    },
  };
}
