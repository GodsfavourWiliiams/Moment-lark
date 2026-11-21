-- Local analysis has not shipped, so the minute ledger has no actual usage.
-- Refuse to erase any unexpected usage: it cannot be converted to video counts.
CREATE TABLE video_allowance_migration_guard (
  unexpected_usage INTEGER NOT NULL CHECK (unexpected_usage = 0)
);
INSERT INTO video_allowance_migration_guard
SELECT COUNT(*) FROM guests WHERE used_seconds != 0 OR reserved_seconds != 0;
DROP TABLE video_allowance_migration_guard;

UPDATE guests SET granted_seconds = 3;
ALTER TABLE guests RENAME COLUMN granted_seconds TO granted_videos;
ALTER TABLE guests RENAME COLUMN used_seconds TO used_videos;
ALTER TABLE guests RENAME COLUMN reserved_seconds TO reserved_videos;
