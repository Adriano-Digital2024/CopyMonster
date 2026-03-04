
-- Table: creative_classifications
CREATE TABLE public.creative_classifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ad_id text NOT NULL,
  classification text NOT NULL DEFAULT 'insufficient_data',
  score numeric NOT NULL DEFAULT 0,
  metrics_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.creative_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own classifications"
  ON public.creative_classifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all classifications"
  ON public.creative_classifications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_creative_classifications_user_class
  ON public.creative_classifications (user_id, classification);

CREATE INDEX idx_creative_classifications_ad
  ON public.creative_classifications (user_id, ad_id);

-- Table: intelligence_logs
CREATE TABLE public.intelligence_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  analysis_type text NOT NULL DEFAULT 'full_analysis',
  input_summary jsonb DEFAULT '{}'::jsonb,
  output_summary jsonb DEFAULT '{}'::jsonb,
  suggestions_generated integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own intelligence logs"
  ON public.intelligence_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all intelligence logs"
  ON public.intelligence_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_intelligence_logs_user
  ON public.intelligence_logs (user_id, created_at DESC);
