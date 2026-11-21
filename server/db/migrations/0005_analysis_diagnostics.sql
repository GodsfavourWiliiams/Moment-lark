-- Content-free, browser-reported diagnostics, not trusted billing evidence.
ALTER TABLE analysis_jobs ADD COLUMN provenance TEXT CHECK(provenance IS NULL OR (json_valid(provenance) AND length(provenance) <= 2048));
ALTER TABLE analysis_jobs ADD COLUMN timings TEXT CHECK(timings IS NULL OR (json_valid(timings) AND length(timings) <= 1024));
