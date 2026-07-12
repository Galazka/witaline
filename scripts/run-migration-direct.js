// Run SQL migration directly against Supabase
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://ukjeyrjbhwnuqznukmzk.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Try calling exec_sql (might fail if function doesn't exist)
  const { error } = await supabase.rpc("exec_sql", { query: "SELECT 1" });
  if (error && error.message?.includes("function") && error.message?.includes("not found")) {
    // Need to create the function via fetch to PostgREST with raw SQL
    console.log("Creating exec_sql function...");
    
    // Create function via PostgREST (it can handle CREATE FUNCTION)
    const sql = `
      CREATE OR REPLACE FUNCTION exec_sql(query text)
      RETURNS void
      LANGUAGE plpgsql SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE query;
      END;
      $$;
    `;
    
    const res = await fetch("https://ukjeyrjbhwnuqznukmzk.supabase.co/rest/v1/", {
      method: "POST",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "params=single-object",
      },
      body: JSON.stringify({ query: sql }),
    });
    
    const text = await res.text();
    console.log("Create function response:", res.status, text.slice(0, 200));
    
    if (!res.ok) {
      console.log("Cannot create function via PostgREST. Trying alternative approach...");
      // Try using supabase rpc to run raw SQL directly
      return await runAlt();
    }
  }
  
  // Now run the migration
  const migrationSQL = `
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_limit INTEGER DEFAULT 0;
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_used INTEGER DEFAULT 0;
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_extra_purchased INTEGER DEFAULT 0;
  `;
  
  const { error: migError } = await supabase.rpc("exec_sql", { query: migrationSQL });
  if (migError) {
    console.error("Migration failed:", migError.message);
  } else {
    console.log("Migration 047 applied successfully!");
    console.log("Added columns: wa_limit, wa_used, wa_extra_purchased");
  }
}

async function runAlt() {
  // Just try the migration via direct Supabase management API
  // Use the service role key with a direct SQL endpoint
  
  const res = await fetch("https://ukjeyrjbhwnuqznukmzk.supabase.co/rest/v1/businesses", {
    method: "GET",
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  console.log("Direct GET businesses status:", res.status);
  
  // Check if columns exist
  const sample = await res.json();
  const first = sample[0] || {};
  console.log("Available columns:", Object.keys(first).join(", "));
  
  // If wa_limit isn't there, try adding via the query function
  // Supabase supports this: https://supabase.com/docs/guides/api/sql-to-api
  
  // Actually, Supabase doesn't support ALTER TABLE via REST. 
  // Need to go through Dashboard SQL Editor or Management API.
  console.log("\nCannot add columns via REST API. Please run in Supabase SQL Editor:");
  console.log("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_limit INTEGER DEFAULT 0;");
  console.log("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_used INTEGER DEFAULT 0;");
  console.log("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS wa_extra_purchased INTEGER DEFAULT 0;");
}

run().catch(e => console.error("Script error:", e));
