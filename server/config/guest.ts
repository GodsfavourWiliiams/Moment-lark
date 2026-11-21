import { z } from "zod";
import type { Bindings } from "../types";
const policySchema = z.object({
  allowanceVideos: z.coerce.number().int().min(1).max(100),
  appOrigin: z.string().url(),
});
export const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
export const LOCAL_SESSION_COOKIE = "ml_guest_local";
export const PUBLIC_SESSION_COOKIE = "__Host-ml_guest";
export const TURNSTILE_ACTION = "guest_session";
export function getGuestPolicy(env: Bindings, requestUrl: string) {
  if (!env.DB) return null;
  const url = new URL(requestUrl);
  const result = policySchema.safeParse({
    allowanceVideos: env.GUEST_ALLOWANCE_VIDEOS,
    appOrigin: env.APP_ORIGIN,
  });
  if (!result.success) return null;
  const origin = new URL(result.data.appOrigin);
  if (origin.origin !== result.data.appOrigin) return null;
  const loopback = ["localhost", "127.0.0.1", "[::1]"];
  if (
    env.GUEST_MODE === "local" &&
    loopback.includes(url.hostname) &&
    loopback.includes(origin.hostname)
  )
    return {
      ...result.data,
      db: env.DB,
      mode: "local-development" as const,
      cookie: LOCAL_SESSION_COOKIE,
      hostname: origin.hostname,
    };
  if (
    env.GUEST_MODE !== "public" ||
    url.protocol !== "https:" ||
    origin.protocol !== "https:" ||
    url.origin !== origin.origin ||
    loopback.includes(url.hostname) ||
    !env.TURNSTILE_SECRET ||
    !env.TURNSTILE_SITE_KEY ||
    !env.NETWORK_HASH_SECRET ||
    env.NETWORK_HASH_SECRET.length < 32
  )
    return null;
  const limits = z
    .object({
      sessions: z.coerce.number().int().min(1).max(100),
      videos: z.coerce.number().int().min(1).max(1000),
    })
    .safeParse({
      sessions: env.NETWORK_GUESTS_PER_DAY,
      videos: env.NETWORK_VIDEOS_PER_DAY,
    });
  if (!limits.success) return null;
  return {
    ...result.data,
    db: env.DB,
    mode: "public" as const,
    cookie: PUBLIC_SESSION_COOKIE,
    hostname: origin.hostname,
    secret: env.TURNSTILE_SECRET,
    siteKey: env.TURNSTILE_SITE_KEY,
    networkSecret: env.NETWORK_HASH_SECRET,
    limits: limits.data,
  };
}
export type GuestPolicy = NonNullable<ReturnType<typeof getGuestPolicy>>;
