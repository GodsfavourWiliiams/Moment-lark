import { z } from "zod";
import type { Bindings } from "../types";

const policySchema = z.object({
  allowanceSeconds: z.coerce.number().int().min(1).max(86_400),
  appOrigin: z.string().url(),
});

export const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
export const LOCAL_SESSION_COOKIE = "ml_guest_local";

/** Local testing only until issuance limits and challenges are implemented. */
export function getLocalGuestPolicy(env: Bindings, requestUrl: string) {
  const hostname = new URL(requestUrl).hostname;
  if (
    env.GUEST_MODE !== "local" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(hostname) ||
    !env.DB
  )
    return null;

  const result = policySchema.safeParse({
    allowanceSeconds: env.GUEST_ALLOWANCE_SECONDS,
    appOrigin: env.APP_ORIGIN,
  });
  if (!result.success) return null;
  return { ...result.data, db: env.DB };
}
