import type { GuestUsage } from "../../shared/contracts/guest";

export type GuestState =
  | { status: "loading" }
  | { status: "ready"; usage: GuestUsage }
  | { status: "unavailable" }
  | { status: "error"; message: string };

export type GuestAction =
  | { type: "loading" }
  | { type: "loaded"; usage: GuestUsage }
  | { type: "unavailable" }
  | { type: "failed"; message: string };
