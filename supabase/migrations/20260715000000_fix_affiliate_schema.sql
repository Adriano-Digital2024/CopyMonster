-- Fix affiliate schema: add missing columns, tables, and fields

-- 1. Add missing columns to affiliate.profiles
ALTER TABLE affiliate.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE affiliate.profiles ADD COLUMN IF NOT EXISTS cpf_cnpj text;
ALTER TABLE affiliate.profiles ADD COLUMN IF NOT EXISTS address_city text;
ALTER TABLE affiliate.profiles ADD COLUMN IF NOT EXISTS address_state text;
ALTER TABLE affiliate.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE affiliate.profiles ADD COLUMN IF NOT EXISTS terms_ip text;
ALTER TABLE affiliate.profiles ADD COLUMN IF NOT EXISTS terms_version text;

-- 2. Add min_payout_amount to commission_rules
ALTER TABLE affiliate.commission_rules ADD COLUMN IF NOT EXISTS min_payout_amount decimal(12,2) DEFAULT 100;

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS affiliate.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on audit_logs"
    ON affiliate.audit_logs
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
