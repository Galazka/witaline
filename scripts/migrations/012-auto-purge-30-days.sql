-- ============================================================
-- 012 — Auto-delete old recordings & transcripts (RODO Storage Limitation)
-- Run in Supabase SQL Editor
-- ============================================================

-- Function: delete records older than 30 days
CREATE OR REPLACE FUNCTION purge_old_records()
RETURNS void AS $$
BEGIN
  -- 1. Anonymize call_logs older than 30 days
  UPDATE call_logs
  SET
    transcript = '',
    ai_summary = '',
    recording_url = '',
    post_handoff_transcript = '',
    post_handoff_summary = '',
    handoff_recording_sid = '',
    handoff_recording_url = '',
    caller_id = '[automatycznie usunięto]',
    from_number = '[deleted]'
  WHERE
    created_at < now() - interval '30 days'
    AND (transcript != '' OR recording_url != '' OR post_handoff_transcript != '' OR handoff_recording_url != '');

  -- 2. Delete transcriptions older than 30 days
  DELETE FROM transcriptions
  WHERE created_at < now() - interval '30 days';

  -- 3. Anonymize callback_requests older than 30 days
  UPDATE callback_requests
  SET
    caller_number = '[deleted]',
    caller_name = '[deleted]',
    matter = ''
  WHERE created_at < now() - interval '30 days';

  -- 4. Log the cleanup
  INSERT INTO contact_messages (company, contact, message)
  VALUES (
    'System',
    'auto-cleanup@witaline.pl',
    'Automatic 30-day data purge completed at ' || now()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: run daily at 3:00 AM
SELECT cron.schedule(
  'purge-old-records-daily',
  '0 3 * * *',
  'SELECT purge_old_records();'
);
