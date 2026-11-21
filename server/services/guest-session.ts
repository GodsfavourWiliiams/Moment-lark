import type { GuestUsage } from "../../shared/contracts/guest";
import { SESSION_LIFETIME_SECONDS } from "../config/guest";
import {
  findGuestSession,
  insertGuestSession,
  type GuestRecord,
} from "../repositories/guests";

function hex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function digestSessionToken(token: string) {
  return hex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)),
    ),
  );
}

function toUsage(record: GuestRecord): GuestUsage {
  return {
    guest: {
      id: record.id,
      expiresAt: new Date(record.expires_at * 1000).toISOString(),
    },
    allowance: {
      grantedSeconds: record.granted_seconds,
      usedSeconds: record.used_seconds,
      reservedSeconds: record.reserved_seconds,
      remainingSeconds:
        record.granted_seconds - record.used_seconds - record.reserved_seconds,
    },
    mode: "local-development",
  };
}

export async function readGuestUsage(
  db: D1Database,
  token: string | undefined,
  now: number,
) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const record = await findGuestSession(
    db,
    await digestSessionToken(token),
    now,
  );
  return record ? toUsage(record) : null;
}

export async function getOrCreateGuest(
  db: D1Database,
  token: string | undefined,
  allowanceSeconds: number,
  now: number,
) {
  const existing = await readGuestUsage(db, token, now);
  if (existing) return { usage: existing, newToken: null };

  const newToken = hex(crypto.getRandomValues(new Uint8Array(32)));
  const id = crypto.randomUUID();
  const expiresAt = now + SESSION_LIFETIME_SECONDS;
  await insertGuestSession(db, {
    id,
    digest: await digestSessionToken(newToken),
    now,
    expiresAt,
    allowanceSeconds,
  });
  return {
    usage: toUsage({
      id,
      expires_at: expiresAt,
      granted_seconds: allowanceSeconds,
      used_seconds: 0,
      reserved_seconds: 0,
    }),
    newToken,
  };
}
