-- Deny paid workspace access until a trusted operator confirms payment.
-- No organisation is automatically marked as paid during migration.
ALTER TABLE "Organisation" ADD COLUMN paid_access_until TIMESTAMPTZ(3);
