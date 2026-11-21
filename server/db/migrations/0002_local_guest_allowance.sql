-- Upgrade the original local test grant without resetting usage or reservations.
-- Guest issuance is currently local-only; this is not a production credit policy.
UPDATE guests SET granted_seconds = 5400 WHERE granted_seconds = 1800;
