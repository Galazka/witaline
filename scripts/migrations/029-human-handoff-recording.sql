-- ================================================================
-- WitaLine - Human handoff recording/transcription
-- Run after enabling Twilio recording and handoff transfer flow.
-- ================================================================

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS has_human_handoff BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_status TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_reason TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_target_number TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_started_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_ended_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_duration_seconds INTEGER DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_recording_sid TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS handoff_recording_url TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_transcript TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_summary TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_transcription_status TEXT DEFAULT '';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_transcribed_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS post_handoff_error TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_call_logs_human_handoff ON call_logs(has_human_handoff);
CREATE INDEX IF NOT EXISTS idx_call_logs_handoff_status ON call_logs(handoff_status);
CREATE INDEX IF NOT EXISTS idx_call_logs_handoff_target ON call_logs(handoff_target_number);
