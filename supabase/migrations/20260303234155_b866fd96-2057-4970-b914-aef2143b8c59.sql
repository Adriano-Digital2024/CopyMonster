
-- Enable pgcrypto extension for token encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. user_integrations: stores encrypted OAuth tokens
CREATE TABLE public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'meta',
  status text NOT NULL DEFAULT 'disconnected',
  encrypted_access_token bytea,
  encrypted_refresh_token bytea,
  token_expires_at timestamp with time zone,
  meta_user_id text,
  meta_ad_account_id text,
  instagram_account_id text,
  scopes text[],
  last_synced_at timestamp with time zone,
  connected_at timestamp with time zone,
  disconnected_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON public.user_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON public.user_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.user_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.user_integrations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all integrations"
  ON public.user_integrations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all integrations"
  ON public.user_integrations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. integration_logs: audit trail
CREATE TABLE public.integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'meta',
  event_type text NOT NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integration logs"
  ON public.integration_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all integration logs"
  ON public.integration_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_integration_logs_user_id ON public.integration_logs(user_id);
CREATE INDEX idx_integration_logs_event_type ON public.integration_logs(event_type);
CREATE INDEX idx_integration_logs_created_at ON public.integration_logs(created_at DESC);

-- 3. ads_data: cached Meta Ads metrics with funnel data
CREATE TABLE public.ads_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_name text,
  campaign_id text,
  adset_name text,
  adset_id text,
  ad_name text,
  ad_id text,
  ad_creative_body text,
  ad_creative_title text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  cpm numeric DEFAULT 0,
  reach integer DEFAULT 0,
  frequency numeric DEFAULT 0,
  roas numeric DEFAULT 0,
  view_content integer DEFAULT 0,
  initiate_checkout integer DEFAULT 0,
  purchases integer DEFAULT 0,
  purchase_value numeric DEFAULT 0,
  cost_per_view_content numeric DEFAULT 0,
  cost_per_initiate_checkout numeric DEFAULT 0,
  cost_per_purchase numeric DEFAULT 0,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ads_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ads data"
  ON public.ads_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ads data"
  ON public.ads_data FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ads_data_user_id ON public.ads_data(user_id);
CREATE INDEX idx_ads_data_date_range ON public.ads_data(date_range_start, date_range_end);
CREATE INDEX idx_ads_data_campaign ON public.ads_data(campaign_id);

-- 4. instagram_data: cached Instagram metrics
CREATE TABLE public.instagram_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id text,
  post_type text,
  caption text,
  permalink text,
  timestamp timestamp with time zone,
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  engagement integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  plays integer DEFAULT 0,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own instagram data"
  ON public.instagram_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all instagram data"
  ON public.instagram_data FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_instagram_data_user_id ON public.instagram_data(user_id);
CREATE INDEX idx_instagram_data_post_id ON public.instagram_data(post_id);
CREATE INDEX idx_instagram_data_timestamp ON public.instagram_data(timestamp DESC);
