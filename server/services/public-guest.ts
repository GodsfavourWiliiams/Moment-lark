import { z } from "zod";
import { TURNSTILE_ACTION } from "../config/guest";

export async function networkWindow(
  secret: string,
  ip: string,
  now: number,
  scope: string,
  seconds = 86400,
) {
  // Cloudflare supplies CF-Connecting-IP. Never accept a client body/X-Forwarded-For override.
  if (!ip || ip.length > 64 || !/^[0-9a-fA-F:.]+$/.test(ip))
    throw new Error("Missing trusted network address");
  const start = Math.floor(now / seconds) * seconds;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`moment-lark:${scope}:${start}:${ip}`),
  );
  const hash = Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return { id: hash, expiresAt: start + seconds };
}
export async function ensureWindow(
  db: D1Database,
  window: { id: string; expiresAt: number },
  cap: number,
) {
  await db
    .prepare(
      "INSERT INTO network_windows(id, cap, expires_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
    )
    .bind(window.id, cap, window.expiresAt)
    .run();
}
export async function takeAttempt(
  db: D1Database,
  window: { id: string; expiresAt: number },
  cap: number,
) {
  await ensureWindow(db, window, cap);
  return !!(await db
    .prepare(
      "UPDATE network_windows SET used = used + 1 WHERE id = ? AND used + reserved < cap RETURNING id",
    )
    .bind(window.id)
    .first());
}
const verification = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  challenge_ts: z.string().optional(),
});
export async function verifyTurnstile(
  secret: string,
  token: string,
  hostname: string,
  ip: string,
  now: number,
) {
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) throw new Error("Verification unavailable");
  const parsed = verification.safeParse(await response.json());
  if (!parsed.success) throw new Error("Invalid verification response");
  const value = parsed.data;
  const timestamp = Date.parse(value.challenge_ts ?? "") / 1000;
  return (
    value.success &&
    value.hostname === hostname &&
    value.action === TURNSTILE_ACTION &&
    Number.isFinite(timestamp) &&
    timestamp <= now + 30 &&
    now - timestamp <= 300
  );
}
