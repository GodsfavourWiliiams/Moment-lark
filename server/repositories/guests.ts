export type GuestRecord = {
  id: string;
  granted_videos: number;
  used_videos: number;
  reserved_videos: number;
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
    SELECT g.id, g.granted_videos, g.used_videos, g.reserved_videos, s.expires_at
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
    allowanceVideos: number;
    publicContext?: { tokenDigest: string; networkWindow: string };
  },
) {
  // D1 batches are transactional: a failed session insert must not leave a guest behind.
  await db.batch([
    ...(input.publicContext
      ? [
          db
            .prepare(
              "INSERT INTO turnstile_redemptions(token_digest, expires_at) VALUES (?, ?)",
            )
            .bind(input.publicContext.tokenDigest, input.now + 600),
          // CHECK cap makes concurrent issuance transactional, including token redemption.
          db
            .prepare("UPDATE network_windows SET used = used + 1 WHERE id = ?")
            .bind(input.publicContext.networkWindow),
        ]
      : []),
    db
      .prepare(
        `INSERT INTO guests (id, created_at, granted_videos) VALUES (?, ?, ?)`,
      )
      .bind(input.id, input.now, input.allowanceVideos),
    db
      .prepare(
        `INSERT INTO guest_sessions (token_digest, guest_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
      )
      .bind(input.digest, input.id, input.now, input.expiresAt),
  ]);
}
