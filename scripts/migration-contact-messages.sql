-- Stwórz tabelę dla wiadomości kontaktowych z formularza na stronie głównej
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  website TEXT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks na kolejność wyświetlania (admin panel pokazuje od najnowszych)
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Indeks na filtrowanie nieprzeczytanych
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);
