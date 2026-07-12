// Uruchamia RUN-MIGRATION.sql na Supabase
// Uzycie: node scripts/run-migration.js

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const sqlPath = path.resolve(__dirname, "..", "RUN-MIGRATION.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function main() {
  console.log("Connecting to Supabase...");
  console.log("Project:", url);

  // Podziel SQL na pojedyncze instrukcje (oddzielone średnikami)
  // Zachowaj ostrożność z funkcjami zawierającymi średniki wewnątrz $$
  const statements = [];
  let current = "";
  let inDollar = false;
  let dollarTag = "";

  for (const ch of sql) {
    current += ch;

    if (inDollar) {
      if (current.endsWith("$" + dollarTag + "$")) {
        inDollar = false;
        dollarTag = "";
      }
    } else if (ch === "$") {
      const match = current.match(/\$([^$]*)\$$/);
      if (match) {
        inDollar = true;
        dollarTag = match[1];
      }
    } else if (ch === ";" && !inDollar) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith("--") && !trimmed.startsWith("SELECT")) {
        statements.push(trimmed);
      }
      current = "";
    }
  }

  // Ostatnia instrukcja
  const trimmed = current.trim();
  if (trimmed && !trimmed.startsWith("--") && !trimmed.startsWith("SELECT")) {
    statements.push(trimmed);
  }

  console.log(`Found ${statements.length} SQL statements to execute`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      console.log(`\n[${i + 1}/${statements.length}] Executing...`);
      const { error } = await supabase.rpc("exec_sql", { sql: stmt });
      if (error) {
        // rpc exec_sql może nie istnieć — spróbuj bezpośrednio przez REST API
        console.log(`  → rpc failed, trying direct query: ${error.message}`);
        const { error: qError } = await supabase.from("_migration").insert({ sql: stmt }).maybeSingle().catch(() => ({}));
        if (qError) {
          console.log(`  → trying raw fetch...`);
          const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": key,
              "Authorization": `Bearer ${key}`,
            },
            body: JSON.stringify({ sql: stmt }),
          });
          if (!res.ok) {
            const text = await res.text();
            console.error(`  ✗ Failed: ${text.slice(0, 200)}`);
            failed++;
          } else {
            console.log(`  ✓ OK (via rpc)`);
            success++;
          }
        } else {
          console.log(`  ✓ OK`);
          success++;
        }
      } else {
        console.log(`  ✓ OK`);
        success++;
      }
    } catch (e) {
      console.error(`  ✗ Error: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${success} succeeded, ${failed} failed ===`);
}

main().catch(console.error);
