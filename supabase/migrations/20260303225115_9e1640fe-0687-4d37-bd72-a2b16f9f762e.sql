
-- =============================================
-- Sprint 1: DNA Versioning System
-- =============================================

-- 1. Add language column to positioning_mappings
ALTER TABLE public.positioning_mappings
ADD COLUMN language text DEFAULT 'pt-BR';

-- 2. Create dna_versions table
CREATE TABLE public.dna_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.positioning_mappings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  version_label text NOT NULL DEFAULT '1.0',
  version_type text NOT NULL DEFAULT 'original',
  source text NOT NULL DEFAULT 'manual',
  blocks jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create dna_update_suggestions table
CREATE TABLE public.dna_update_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.positioning_mappings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  block_key text NOT NULL,
  current_value text,
  suggested_value text NOT NULL,
  justification text NOT NULL,
  impact_estimate text NOT NULL DEFAULT 'medium',
  data_source text NOT NULL DEFAULT 'market_analysis',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create user_notifications table
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'system',
  title_key text NOT NULL,
  message_key text NOT NULL,
  message_params jsonb,
  action_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Enable RLS on all new tables
ALTER TABLE public.dna_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_update_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for dna_versions
CREATE POLICY "Users can view their own dna versions"
ON public.dna_versions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all dna versions"
ON public.dna_versions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own dna versions"
ON public.dna_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dna versions"
ON public.dna_versions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dna versions"
ON public.dna_versions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dna versions"
ON public.dna_versions FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS policies for dna_update_suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.dna_update_suggestions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all suggestions"
ON public.dna_update_suggestions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own suggestions"
ON public.dna_update_suggestions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestions"
ON public.dna_update_suggestions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all suggestions"
ON public.dna_update_suggestions FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.user_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.user_notifications FOR DELETE
USING (auth.uid() = user_id);

-- 9. Indexes for performance
CREATE INDEX idx_dna_versions_mapping_id ON public.dna_versions(mapping_id);
CREATE INDEX idx_dna_versions_user_id ON public.dna_versions(user_id);
CREATE INDEX idx_dna_versions_is_active ON public.dna_versions(mapping_id, is_active) WHERE is_active = true;
CREATE INDEX idx_dna_update_suggestions_mapping_id ON public.dna_update_suggestions(mapping_id);
CREATE INDEX idx_dna_update_suggestions_status ON public.dna_update_suggestions(user_id, status) WHERE status = 'pending';
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id, is_read) WHERE is_read = false;

-- 10. Updated_at trigger for dna_versions
CREATE TRIGGER update_dna_versions_updated_at
BEFORE UPDATE ON public.dna_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
