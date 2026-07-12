# Migration Strategy

## Current State

- **`000_reference.sql`** — single idempotent file representing the full current schema (July 2026). Safe to re-run: all statements use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
- **`scripts/migrations-archive/`** — all past migration files (012–058 + supabase originals) preserved for history.

## How Migrations Were Applied

Previously, migrations were run manually via Supabase SQL Editor. There is no `supabase_migrations` tracking table — the database state is the source of truth. `000_reference.sql` consolidates ~70 individual migration files into one authoritative schema.

## Adding New Migrations

**Option A: Supabase CLI (recommended for new work)**

1. `supabase login` (one-time)
2. `supabase link --project-ref <ref>` (one-time)
3. `supabase db pull` — generates a timestamped baseline from remote (replaces `000_reference.sql`)
4. `supabase migration new <description>` — creates a new migration file
5. Write your DDL in the generated `<timestamp>_<description>.sql`
6. `supabase db push` — applies pending migrations to remote

**Option B: Manual SQL Editor**

1. Create a new file in `supabase/migrations/` with a sequential name: `057_<description>.sql`
2. Use `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to stay idempotent
3. Run in Supabase SQL Editor

## File Naming

When creating new migration files manually:
- Sequential number prefix: `057_`, `058_`, etc.
- Snake_case description
- Idempotent patterns preferred
