-- Add optional, unique, human-readable organisation login codes.
-- Existing UUIDs remain the internal tenant keys; no code is assigned implicitly.
ALTER TABLE "Organisation"
  ADD COLUMN "code" VARCHAR(64);

ALTER TABLE "Organisation"
  ADD CONSTRAINT "Organisation_code_format"
  CHECK ("code" IS NULL OR "code" ~ '^[a-z][a-z0-9-]{2,63}$');

CREATE UNIQUE INDEX "Organisation_code_key"
  ON "Organisation"("code");
