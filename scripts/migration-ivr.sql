-- Extension dla firm (np. *31)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS extension TEXT;

-- Unikalny indeks, żeby dwa razy nie przydzielić tego samego kodu
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_extension ON businesses(extension) WHERE extension IS NOT NULL;

-- Tabela próśb o oddzwonienie
CREATE TABLE IF NOT EXISTS callback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_number TEXT NOT NULL,
  caller_name TEXT DEFAULT '',
  matter TEXT DEFAULT '',
  call_sid TEXT,
  business_id UUID REFERENCES businesses ON DELETE SET NULL,
  handled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE callback_requests ENABLE ROW LEVEL SECURITY;
