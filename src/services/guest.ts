import {
  guestErrorSchema,
  guestChallengeSchema,
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

async function requestUsage(
  path: string,
  method: "GET" | "POST",
  turnstileToken?: string,
) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    ...(method === "POST"
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(turnstileToken ? { turnstileToken } : {}),
        }
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

async function resumeOrCreateGuest(turnstileToken?: string) {
  try {
    return await requestUsage("/api/guest/usage", "GET");
  } catch (error) {
    if (!(error instanceof GuestApiError) || error.code !== "session_required")
      throw error;
    await requestUsage("/api/guest/session", "POST", turnstileToken);
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
export function loadGuestUsage(turnstileToken?: string): Promise<GuestUsage> {
  if (!pendingSession) {
    const initialize = async (): Promise<GuestUsage> => {
      if (typeof navigator !== "undefined" && navigator.locks) {
        return await navigator.locks.request("moment-lark-guest-session", () =>
          resumeOrCreateGuest(turnstileToken),
        );
      }
      return resumeOrCreateGuest(turnstileToken);
    };
    pendingSession = initialize().finally(() => {
      pendingSession = null;
    });
  }
  return pendingSession;
}

export async function loadGuestChallenge() {
  const response = await fetch("/api/guest/challenge", {
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new GuestApiError(
      "verification_unavailable",
      "Verification is unavailable. Please retry.",
    );
  return guestChallengeSchema.parse(await response.json());
}
