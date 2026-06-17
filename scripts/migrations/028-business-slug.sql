ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

UPDATE businesses SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug) WHERE slug IS NOT NULL;
