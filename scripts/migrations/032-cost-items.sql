-- Cost items for tracking own costs (marketing, server, tools, etc.)
CREATE TABLE IF NOT EXISTS cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'one-time', 'irregular')),
  category TEXT DEFAULT 'other',
  due_date DATE,
  is_paid BOOLEAN DEFAULT false,
  paid_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_items_admin_all ON cost_items USING (true);

-- Add previous_period_data column to store month-over-month comparison snapshots
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS previous_month_cost_snapshot JSONB DEFAULT '{}';
