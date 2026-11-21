import type { GuestAction, GuestState } from "@/types/guest";

export function guestReducer(
  _state: GuestState,
  action: GuestAction,
): GuestState {
  switch (action.type) {
    case "loading":
      return { status: "loading" };
    case "loaded":
      return { status: "ready", usage: action.usage };
    case "unavailable":
      return { status: "unavailable" };
    case "failed":
      return { status: "error", message: action.message };
  }
}
