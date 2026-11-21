/** Bounded cleanup of expired leases and disposable verification metadata.
 * Guest identities, allowances, completed jobs and diagnostics are retained. */
export async function maintainGuestRecords(db: D1Database, now: number) {
  await db.batch([
    db
      .prepare(
        "UPDATE analysis_jobs SET status = 'expired' WHERE id IN (SELECT id FROM analysis_jobs WHERE status = 'reserved' AND expires_at <= ? LIMIT 500)",
      )
      .bind(now),
    db
      .prepare(
        "DELETE FROM turnstile_redemptions WHERE token_digest IN (SELECT token_digest FROM turnstile_redemptions WHERE expires_at <= ? LIMIT 500)",
      )
      .bind(now),
    db
      .prepare(
        "DELETE FROM network_windows WHERE id IN (SELECT id FROM network_windows WHERE expires_at <= ? AND reserved = 0 AND NOT EXISTS (SELECT 1 FROM analysis_jobs WHERE network_window = network_windows.id) LIMIT 500)",
      )
      .bind(now),
  ]);
}
