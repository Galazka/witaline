ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_call_logs_elevenlabs_conv ON call_logs(elevenlabs_conversation_id);
