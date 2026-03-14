-- Add encryption columns to agreements table
ALTER TABLE agreements
  ADD COLUMN title_iv text,
  ADD COLUMN content_iv text,
  ADD COLUMN is_encrypted boolean NOT NULL DEFAULT false;
