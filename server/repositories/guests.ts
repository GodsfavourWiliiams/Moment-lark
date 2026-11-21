export type GuestRecord = {
  id: string;
  granted_seconds: number;
  used_seconds: number;
  reserved_seconds: number;
  expires_at: number;
};

export async function findGuestSession(
  db: D1Database,
  digest: string,
  now: number,
) {
  return db
    .prepare(
      `
    SELECT g.id, g.granted_seconds, g.used_seconds, g.reserved_seconds, s.expires_at
    FROM guest_sessions s JOIN guests g ON g.id = s.guest_id
    WHERE s.token_digest = ? AND s.expires_at > ?
  `,
    )
    .bind(digest, now)
    .first<GuestRecord>();
}

export async function insertGuestSession(
  db: D1Database,
  input: {
    id: string;
    digest: string;
    now: number;
    expiresAt: number;
    allowanceSeconds: number;
  },
) {
  // D1 batches are transactional: a failed session insert must not leave a guest behind.
  await db.batch([
    db
      .prepare(
        `INSERT INTO guests (id, created_at, granted_seconds) VALUES (?, ?, ?)`,
      )
      .bind(input.id, input.now, input.allowanceSeconds),
    db
      .prepare(
        `INSERT INTO guest_sessions (token_digest, guest_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
      )
      .bind(input.digest, input.id, input.now, input.expiresAt),
  ]);
}
