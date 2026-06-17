-- Backfill: add owners to business_members for all existing businesses
INSERT INTO business_members (business_id, user_id, role, accepted_at)
SELECT id, owner_uid, 'owner', now()
FROM businesses
WHERE owner_uid IS NOT NULL
ON CONFLICT (business_id, user_id) DO NOTHING;
