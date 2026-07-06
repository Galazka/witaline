-- Allow 'human' role in messages table for business live chat replies
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_role_check;
ALTER TABLE messages ADD CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant', 'system', 'human'));

-- Drop and recreate the insert policy so business owners can insert any role
DROP POLICY IF EXISTS messages_insert_own ON messages;
CREATE POLICY messages_insert_own ON messages FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE owner_uid = auth.uid())
);
