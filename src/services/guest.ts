import {
  guestErrorSchema,
  guestUsageSchema,
  type GuestUsage,
} from "../../shared/contracts/guest";

export class GuestApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GuestApiError";
  }
}

async function requestUsage(path: string, method: "GET" | "POST") {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    ...(method === "POST"
      ? { headers: { "Content-Type": "application/json" }, body: "{}" }
      : {}),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const result = guestErrorSchema.safeParse(body);
    throw new GuestApiError(
      result.success ? result.data.error.code : "service_unavailable",
      result.success
        ? result.data.error.message
        : "Guest service is unavailable. Please try again.",
    );
  }
  return guestUsageSchema.parse(body);
}

async function resumeOrCreateGuest() {
  try {
    return await requestUsage("/api/guest/usage", "GET");
  } catch (error) {
    if (!(error instanceof GuestApiError) || error.code !== "session_required")
      throw error;
    await requestUsage("/api/guest/session", "POST");
    // Verify cookie persistence; otherwise refreshes would repeatedly create new guests.
    try {
      return await requestUsage("/api/guest/usage", "GET");
    } catch (verificationError) {
      if (
        verificationError instanceof GuestApiError &&
        verificationError.code === "session_required"
      ) {
        throw new GuestApiError(
          "cookies_required",
          "Allow cookies for this site to keep your guest session.",
        );
      }
      throw verificationError;
    }
  }
}

let pendingSession: Promise<GuestUsage> | null = null;

/** Deduplicate Strict Mode mounts; Web Locks also coordinate same-origin tabs. */
export function loadGuestUsage(): Promise<GuestUsage> {
  if (!pendingSession) {
    const initialize = async (): Promise<GuestUsage> => {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return await navigator.locks.request(
          "moment-lark-guest-session",
          resumeOrCreateGuest,
        );
      }
      return resumeOrCreateGuest();
    };
    pendingSession = initialize().finally(() => {
      pendingSession = null;
    });
  }
  return pendingSession;
}
