-- 014 — Trash system: soft-delete with recovery
-- Adds deleted_at column to tables that need trash/bin functionality

ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE feedback ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE callback_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
