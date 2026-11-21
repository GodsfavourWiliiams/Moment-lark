"use client";

import { useEffect, useReducer, useState } from "react";
import { GuestApiError, loadGuestUsage } from "@/services/guest";
import { guestReducer } from "@/state/guest";

export function useGuest() {
  const [state, dispatch] = useReducer(guestReducer, { status: "loading" });
  const [attempt, retry] = useState(0);

  useEffect(() => {
    let active = true;
    loadGuestUsage().then(
      (usage) => {
        if (active) dispatch({ type: "loaded", usage });
      },
      (error: unknown) => {
        if (!active) return;
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

  return {
    state,
    retry: () => {
      dispatch({ type: "loading" });
      retry((value) => value + 1);
    },
  };
}
