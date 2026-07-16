CREATE TABLE IF NOT EXISTS affiliate.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id uuid REFERENCES affiliate.profiles(id) NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}',
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate can read own notifications"
    ON affiliate.notifications
    FOR SELECT
    TO authenticated
    USING (affiliate_id IN (SELECT id FROM affiliate.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_notifications_affiliate_unread
    ON affiliate.notifications (affiliate_id, created_at DESC)
    WHERE NOT read;
