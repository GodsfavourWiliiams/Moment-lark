CREATE TABLE guests (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL,
  granted_seconds INTEGER NOT NULL CHECK (granted_seconds >= 0),
  used_seconds INTEGER NOT NULL DEFAULT 0 CHECK (used_seconds >= 0),
  reserved_seconds INTEGER NOT NULL DEFAULT 0 CHECK (reserved_seconds >= 0),
  CHECK (used_seconds + reserved_seconds <= granted_seconds)
);

CREATE TABLE guest_sessions (
  token_digest TEXT PRIMARY KEY NOT NULL,
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at)
);

CREATE INDEX guest_sessions_guest_id ON guest_sessions(guest_id);
CREATE INDEX guest_sessions_expiry ON guest_sessions(expires_at);
