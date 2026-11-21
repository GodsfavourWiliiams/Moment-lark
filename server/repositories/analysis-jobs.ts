import type { AnalysisJob } from "../../shared/contracts/analysis-job";

const LEASE_SECONDS = 15 * 60;
export async function expireJobs(db: D1Database, guestId: string, now: number) {
  await db
    .prepare(
      "UPDATE analysis_jobs SET status = 'expired' WHERE guest_id = ? AND status = 'reserved' AND expires_at <= ?",
    )
    .bind(guestId, now)
    .run();
}
export async function reserveJob(
  db: D1Database,
  guestId: string,
  input: { id: string; sourceId: string; fileBytes: number },
  now: number,
) {
  await expireJobs(db, guestId, now);
  // One atomic INSERT + trigger: competing tabs cannot both spend the last slot.
  await db
    .prepare(
      `INSERT INTO analysis_jobs (id, guest_id, source_id, file_bytes, created_at, expires_at)
    SELECT ?, id, ?, ?, ?, ? FROM guests
    WHERE id = ? AND used_videos + reserved_videos < granted_videos
    ON CONFLICT DO NOTHING`,
    )
    .bind(
      input.id,
      input.sourceId,
      input.fileBytes,
      now,
      now + LEASE_SECONDS,
      guestId,
    )
    .run();
  return db
    .prepare(
      "SELECT id, status FROM analysis_jobs WHERE id = ? AND guest_id = ? AND source_id = ? AND file_bytes = ?",
    )
    .bind(input.id, guestId, input.sourceId, input.fileBytes)
    .first<AnalysisJob>();
}
export async function changeJob(
  db: D1Database,
  guestId: string,
  id: string,
  action: "complete" | "cancel" | "heartbeat",
  now: number,
) {
  await expireJobs(db, guestId, now);
  if (action === "heartbeat") {
    await db
      .prepare(
        "UPDATE analysis_jobs SET expires_at = ? WHERE id = ? AND guest_id = ? AND status = 'reserved'",
      )
      .bind(now + LEASE_SECONDS, id, guestId)
      .run();
  } else {
    await db
      .prepare(
        "UPDATE analysis_jobs SET status = ? WHERE id = ? AND guest_id = ? AND status = 'reserved'",
      )
      .bind(action === "complete" ? "completed" : "cancelled", id, guestId)
      .run();
  }
  return db
    .prepare(
      "SELECT id, status FROM analysis_jobs WHERE id = ? AND guest_id = ?",
    )
    .bind(id, guestId)
    .first<AnalysisJob>();
}
