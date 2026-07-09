-- ==========================================
-- 1. SCHEMAS & ENUMS
-- ==========================================
CREATE SCHEMA IF NOT EXISTS affiliate;
CREATE SCHEMA IF NOT EXISTS finance;

DO $$ BEGIN
    CREATE TYPE finance.ledger_entry_type AS ENUM ('CREDIT', 'DEBIT');
    CREATE TYPE affiliate.commission_status AS ENUM ('HOLDING', 'ELIGIBLE', 'CANCELLED', 'REFUNDED');
    CREATE TYPE affiliate.kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==========================================
-- 2. TABLES
-- ==========================================

-- Partner Profiles
CREATE TABLE IF NOT EXISTS affiliate.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    paypal_email text,
    trust_score int DEFAULT 100,
    kyc_status affiliate.kyc_status DEFAULT 'PENDING',
    kyc_metadata jsonb DEFAULT '{}',
    paypal_last_changed_at timestamptz,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Commission Rules (Versioned)
CREATE TABLE IF NOT EXISTS affiliate.commission_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version_name text NOT NULL,
    percentage decimal(5,2) NOT NULL,
    retention_days int DEFAULT 45,
    is_current boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Tracking Clicks
CREATE TABLE IF NOT EXISTS affiliate.tracking_clicks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES affiliate.profiles(id) NOT NULL,
    ip_address inet,
    user_agent text,
    is_vpn boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Operational Layer: Commissions
CREATE TABLE IF NOT EXISTS affiliate.commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES affiliate.profiles(id) NOT NULL,
    stripe_event_id text UNIQUE NOT NULL, -- IDEMPOTENCY KEY
    amount_gross decimal(12,2) NOT NULL,
    commission_amount decimal(12,2) NOT NULL,
    status affiliate.commission_status DEFAULT 'HOLDING',
    eligible_at timestamptz NOT NULL,
    risk_score int DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Accounting Layer: Ledger Entries (IMMUTABLE)
CREATE TABLE IF NOT EXISTS finance.ledger_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES affiliate.profiles(id) NOT NULL,
    amount decimal(12,2) NOT NULL,
    entry_type finance.ledger_entry_type NOT NULL,
    reference_type text NOT NULL, -- 'COMMISSION', 'PAYOUT'
    reference_id uuid NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Payout Requests
CREATE TABLE IF NOT EXISTS finance.payout_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES affiliate.profiles(id) NOT NULL,
    amount decimal(12,2) NOT NULL,
    paypal_email_snapshot text NOT NULL,
    status text DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, EXECUTED, FAILED
    risk_score int DEFAULT 0,
    paypal_payout_batch_id text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE affiliate.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.tracking_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.payout_requests ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users view own profile" ON affiliate.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins full access profiles" ON affiliate.profiles TO authenticated USING ((auth.jwt() ->> 'role') = 'admin');

-- Commissions Policies
CREATE POLICY "Users view own commissions" ON affiliate.commissions FOR SELECT 
USING (EXISTS (SELECT 1 FROM affiliate.profiles p WHERE p.id = affiliate_id AND p.user_id = auth.uid()));
CREATE POLICY "Admins full access commissions" ON affiliate.commissions TO authenticated USING ((auth.jwt() ->> 'role') = 'admin');

-- Ledger Policies
CREATE POLICY "Users view own ledger" ON finance.ledger_entries FOR SELECT 
USING (EXISTS (SELECT 1 FROM affiliate.profiles p WHERE p.id = affiliate_id AND p.user_id = auth.uid()));
CREATE POLICY "Admins full access ledger" ON finance.ledger_entries TO authenticated USING ((auth.jwt() ->> 'role') = 'admin');

-- Payouts Policies
CREATE POLICY "Users view own payout requests" ON finance.payout_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM affiliate.profiles p WHERE p.id = affiliate_id AND p.user_id = auth.uid()));
CREATE POLICY "Admins full access payouts" ON finance.payout_requests TO authenticated USING ((auth.jwt() ->> 'role') = 'admin');

-- ==========================================
-- 4. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_ledger_affiliate ON finance.ledger_entries(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON affiliate.commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON affiliate.commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_eligible_at ON affiliate.commissions(eligible_at);
