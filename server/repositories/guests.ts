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
  },
) {
  // D1 batches are transactional: a failed session insert must not leave a guest behind.
  await db.batch([
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
