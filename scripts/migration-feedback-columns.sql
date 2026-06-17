-- Dodaj kolumny do tabeli feedback dla widget feedbacku
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'voice';

-- Indeks do szybkiego wyszukiwania feedbacku po konwersacji
CREATE INDEX IF NOT EXISTS idx_feedback_conversation_id ON feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback(source);
