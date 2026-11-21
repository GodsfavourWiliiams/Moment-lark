-- Public guest protection. No IP addresses, media or transcript text are stored.
CREATE TABLE network_windows (
  id TEXT PRIMARY KEY NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK(used >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved >= 0),
  cap INTEGER NOT NULL CHECK(cap > 0),
  expires_at INTEGER NOT NULL,
  CHECK(used + reserved <= cap)
);
--> statement-breakpoint
CREATE INDEX network_windows_expiry ON network_windows(expires_at);
--> statement-breakpoint
CREATE TABLE turnstile_redemptions (
  token_digest TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX turnstile_redemptions_expiry ON turnstile_redemptions(expires_at);
--> statement-breakpoint
ALTER TABLE analysis_jobs ADD COLUMN network_window TEXT REFERENCES network_windows(id);
--> statement-breakpoint
CREATE TRIGGER analysis_network_reserve AFTER INSERT ON analysis_jobs
WHEN NEW.network_window IS NOT NULL
BEGIN
  UPDATE network_windows SET reserved = reserved + 1 WHERE id = NEW.network_window;
END;
--> statement-breakpoint
CREATE TRIGGER analysis_network_finish AFTER UPDATE OF status ON analysis_jobs
WHEN OLD.status = 'reserved' AND NEW.status != 'reserved' AND NEW.network_window IS NOT NULL
BEGIN
  UPDATE network_windows SET reserved = reserved - 1,
    used = used + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END
  WHERE id = NEW.network_window;
END;
