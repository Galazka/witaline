-- Coupons & discount system

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  discount_percent DECIMAL(5,2) CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount > 0),
  max_uses INTEGER DEFAULT 0, -- 0 = unlimited
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ, -- NULL = no expiry
  applicable_plans TEXT[] DEFAULT '{}', -- empty = all plans
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track which coupons were applied to which businesses
CREATE TABLE coupon_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses ON DELETE CASCADE NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now(),
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL
);

-- Auto-discount rules (time-limited promotions)
CREATE TABLE discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_percent DECIMAL(5,2) CHECK (discount_percent > 0 AND discount_percent <= 100),
  discount_amount DECIMAL(10,2) CHECK (discount_amount > 0),
  target_plans TEXT[] DEFAULT '{}', -- empty = all plans
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  max_uses_total INTEGER DEFAULT 0, -- 0 = unlimited
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active) WHERE active = TRUE;
CREATE INDEX idx_coupon_usages_business ON coupon_usages(business_id);
CREATE INDEX idx_discount_rules_active ON discount_rules(active, start_at, end_at);

-- RLS: only admins can manage coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY coupons_admin_all ON coupons USING (auth.role() = 'service_role');

ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY coupon_usages_admin_all ON coupon_usages USING (auth.role() = 'service_role');

ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY discount_rules_admin_all ON discount_rules USING (auth.role() = 'service_role');

-- Insert welcome coupon: 50% off first month
INSERT INTO coupons (code, description, discount_percent, max_uses, applicable_plans, valid_until)
VALUES ('WITAJ50', '50% zniżki na pierwszy miesiąc', 50, 100, '{}', now() + interval '90 days');
