-- Add url_hash column for secure URL lookup
-- Stores SHA-256(HMAC-SHA256(id, APP_ENCRYPTION_SECRET)) so raw UUIDs
-- cannot be derived from a database leak.
ALTER TABLE agreements ADD COLUMN url_hash text;
CREATE UNIQUE INDEX idx_agreements_url_hash ON agreements(url_hash);
