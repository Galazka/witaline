-- WitaLine - Conversations, Messages, Transcriptions, Bot Memory

-- ============================================
-- CONVERSATIONS (chat sessions)
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'voice', 'sms', 'widget')),
  caller_id TEXT,
  caller_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  summary TEXT DEFAULT '',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  tags TEXT[] DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_business_id ON conversations(business_id);
CREATE INDEX idx_conversations_channel ON conversations(channel);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- ============================================
-- MESSAGES (individual chat messages)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_business_id ON messages(business_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- TRANSCRIPTIONS (voice call transcriptions)
-- ============================================
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations ON DELETE SET NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  call_log_id UUID REFERENCES call_logs ON DELETE SET NULL,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  language TEXT DEFAULT 'pl',
  duration_seconds INTEGER,
  speaker TEXT DEFAULT 'unknown' CHECK (speaker IN ('caller', 'assistant', 'unknown')),
  confidence NUMERIC(3,2),
  summary TEXT DEFAULT '',
  key_phrases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transcriptions_business_id ON transcriptions(business_id);
CREATE INDEX idx_transcriptions_conversation_id ON transcriptions(conversation_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);

-- ============================================
-- BUSINESS_KNOWLEDGE (bot knowledge base)
-- ============================================
CREATE TABLE business_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'services', 'pricing', 'hours', 'location', 'faq',
    'products', 'policies', 'team', 'promotions', 'custom'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_business_knowledge_business_id ON business_knowledge(business_id);
CREATE INDEX idx_business_knowledge_category ON business_knowledge(category);

-- ============================================
-- DASHBOARD_CONFIGS (customizable dashboard layouts)
-- ============================================
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL UNIQUE,
  layout JSONB DEFAULT '{
    "widgets": [
      {"id": "stats", "type": "stats", "enabled": true, "order": 0},
      {"id": "recent_chats", "type": "chats", "enabled": true, "order": 1},
      {"id": "calls", "type": "calls", "enabled": true, "order": 2},
      {"id": "reservations", "type": "reservations", "enabled": true, "order": 3}
    ]
  }',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_select_own ON conversations
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY conversations_insert_own ON conversations
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY conversations_update_own ON conversations
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_select_own ON messages
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY messages_insert_own ON messages
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transcriptions_select_own ON transcriptions
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY transcriptions_insert_own ON transcriptions
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

ALTER TABLE business_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_knowledge_select_own ON business_knowledge
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY business_knowledge_insert_own ON business_knowledge
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY business_knowledge_update_own ON business_knowledge
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY business_knowledge_delete_own ON business_knowledge
  FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY dashboard_configs_select_own ON dashboard_configs
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY dashboard_configs_insert_own ON dashboard_configs
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));
CREATE POLICY dashboard_configs_update_own ON dashboard_configs
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid()));

-- Admin policies (service_role)
CREATE POLICY conversations_admin_all ON conversations USING (auth.role() = 'service_role');
CREATE POLICY messages_admin_all ON messages USING (auth.role() = 'service_role');
CREATE POLICY transcriptions_admin_all ON transcriptions USING (auth.role() = 'service_role');
CREATE POLICY business_knowledge_admin_all ON business_knowledge USING (auth.role() = 'service_role');
CREATE POLICY dashboard_configs_admin_all ON dashboard_configs USING (auth.role() = 'service_role');
