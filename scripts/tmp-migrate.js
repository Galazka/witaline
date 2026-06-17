const https = require("https");

const supabaseUrl = "ukjeyrjbhwnuqznukmzk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVramV5cmpiaHdudXF6bnVrbXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwMDkyMCwiZXhwIjoyMDk1ODc2OTIwfQ.yw3tlCFOlbhK2wrusYXl9JPLO5U_ZAESGe_5CD0PYhk";

const sql = `
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dtmf_code TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS voice_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS to_number TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS rodo_consent_played BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS rodo_consent_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS classification TEXT NOT NULL DEFAULT 'unknown';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_classification_check;
  ALTER TABLE call_logs ADD CONSTRAINT call_logs_classification_check
    CHECK (classification IN ('spam','offer','order','question','booking','unknown'));
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS blocked_callers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  reason TEXT DEFAULT '',
  blocked_by TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blocked_callers_phone ON blocked_callers(phone);

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  to_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  elevenlabs_voice_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  min_plan TEXT NOT NULL DEFAULT 'start_100',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

SELECT 'migration done' AS status;
`;

const body = JSON.stringify({ query: sql });
const opts = {
  method: "POST",
  hostname: supabaseUrl,
  path: "/rest/v1/rpc/pgclient_sql",
  headers: {
    apikey: supabaseKey,
    Authorization: "Bearer " + supabaseKey,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    Prefer: "no-count",
  },
};
const req = https.request(opts, (res) => {
  let d = "";
  res.on("data", (c) => (d += c));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", d.substring(0, 500));
  });
});
req.write(body);
req.end();
