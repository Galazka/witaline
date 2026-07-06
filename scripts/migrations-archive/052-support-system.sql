CREATE TABLE IF NOT EXISTS support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('support', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_agents_user ON support_agents(user_id);

ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_agents_read_own" ON support_agents;
CREATE POLICY "support_agents_read_own" ON support_agents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "support_agents_admin_all" ON support_agents;
CREATE POLICY "support_agents_admin_all" ON support_agents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM support_agents WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_phone TEXT,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  assigned_to UUID REFERENCES support_agents(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'voice',
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conversations_assigned ON support_conversations(assigned_to);

ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_conversations_select" ON support_conversations;
CREATE POLICY "support_conversations_select" ON support_conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_agents WHERE user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "support_conversations_insert" ON support_conversations;
CREATE POLICY "support_conversations_insert" ON support_conversations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_agents WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IN (SELECT owner_uid FROM businesses WHERE id = business_id)
  );

DROP POLICY IF EXISTS "support_conversations_update" ON support_conversations;
CREATE POLICY "support_conversations_update" ON support_conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM support_agents WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'business', 'system')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation ON support_messages(conversation_id);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_messages_select" ON support_messages;
CREATE POLICY "support_messages_select" ON support_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM support_agents WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IN (SELECT owner_uid FROM businesses WHERE id IN (
      SELECT business_id FROM support_conversations WHERE id = conversation_id
    ))
  );

DROP POLICY IF EXISTS "support_messages_insert" ON support_messages;
CREATE POLICY "support_messages_insert" ON support_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM support_agents WHERE user_id = auth.uid() AND is_active = true)
    OR auth.uid() IN (SELECT owner_uid FROM businesses WHERE id IN (
      SELECT business_id FROM support_conversations WHERE id = conversation_id
    ))
  );