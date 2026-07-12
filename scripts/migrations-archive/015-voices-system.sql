-- 015 — Voices system + business voice selection

CREATE TABLE IF NOT EXISTS voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  elevenlabs_voice_id TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  min_plan TEXT DEFAULT 'start_100',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS voice_id UUID REFERENCES voices(id);

-- Seed voices (5 male + 5 female)
INSERT INTO voices (display_name, gender, elevenlabs_voice_id, is_default, min_plan, sort_order) VALUES
  ('Maja', 'female', 'tWVHsc0fuVfAZWfScX9a', true, 'start_100', 1),
  ('Maja 2', 'female', 'W0sqKm1Sfw1EzlCH14FQ', false, 'growth', 2),
  ('Maja 3', 'female', 'lehrjHysCyPSvjt0uSy6', false, 'growth', 3),
  ('Maja 4', 'female', 'Bz1e1clEKwgN71Vx7cxj', false, 'enterprise_2000', 4),
  ('Maja 5', 'female', 'F9eb9uZYeJuHuO7Uvs1R', false, 'enterprise_2000', 5)
ON CONFLICT (elevenlabs_voice_id) DO NOTHING;

INSERT INTO voices (display_name, gender, elevenlabs_voice_id, is_default, min_plan, sort_order) VALUES
  ('Tomasz', 'male', 'QgQMRjD48AWrvWghFC3J', false, 'start_100', 6),
  ('Tomasz 2', 'male', 'g8ZOdhoD9R6eYKPTjKbE', false, 'growth', 7),
  ('Tomasz 3', 'male', 'xQrPQOj94zgi24D2y1D1', false, 'growth', 8),
  ('Tomasz 4', 'male', '853X4BjOscPIWJYTmuYo', false, 'enterprise_2000', 9),
  ('Tomasz 5', 'male', 'ju4v8uYSowm1stRz3YUN', false, 'enterprise_2000', 10)
ON CONFLICT (elevenlabs_voice_id) DO NOTHING;
