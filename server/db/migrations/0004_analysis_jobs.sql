-- A reservation holds one source-video slot, never media or transcript content.
CREATE TABLE analysis_jobs (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  file_bytes INTEGER NOT NULL CHECK(file_bytes > 0 AND file_bytes <= 2000000000),
  status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','completed','cancelled','expired')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE(guest_id, source_id)
);
--> statement-breakpoint
CREATE INDEX analysis_jobs_guest_status ON analysis_jobs(guest_id, status, expires_at);
--> statement-breakpoint
CREATE TRIGGER analysis_job_reserve AFTER INSERT ON analysis_jobs
BEGIN
  UPDATE guests SET reserved_videos = reserved_videos + 1 WHERE id = NEW.guest_id;
END;
--> statement-breakpoint
CREATE TRIGGER analysis_job_finish AFTER UPDATE OF status ON analysis_jobs
WHEN OLD.status = 'reserved' AND NEW.status != 'reserved'
BEGIN
  UPDATE guests SET reserved_videos = reserved_videos - 1,
    used_videos = used_videos + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END
  WHERE id = NEW.guest_id;
END;
