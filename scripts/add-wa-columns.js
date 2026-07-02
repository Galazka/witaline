fetch("https://ukjeyrjbhwnuqznukmzk.supabase.co/rest/v1/rpc/add_wa_columns", {
  method: "POST",
  headers: {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVramV5cmpiaHdudXF6bnVrbXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwMDkyMCwiZXhwIjoyMDk1ODc2OTIwfQ.yw3tlCFOlbhK2wrusYXl9JPLO5U_ZAESGe_5CD0PYhk",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVramV5cmpiaHdudXF6bnVrbXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwMDkyMCwiZXhwIjoyMDk1ODc2OTIwfQ.yw3tlCFOlbhK2wrusYXl9JPLO5U_ZAESGe_5CD0PYhk",
    "Content-Type": "application/json"
  }
}).then(r => r.text()).then(t => console.log("rpc result:", t)).catch(e => console.error(e));

// Try SQL directly via Supabase Management API
fetch("https://api.supabase.com/v1/projects/ukjeyrjbhwnuqznukmzk/database/query", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sbp_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query: "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_limit INTEGER DEFAULT 0; ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_used INTEGER DEFAULT 0; ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_extra_purchased INTEGER DEFAULT 0;"
  })
}).then(r => r.text()).then(t => console.log("sql result:", t)).catch(e => console.error("sql error:", e));
