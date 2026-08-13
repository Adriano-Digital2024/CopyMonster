-- ETAPA 9: Global LLM provider configuration with fallback.
-- Allows the admin to change the default provider+model without
-- touching code or per-agent edits, and to define a fallback that
-- chat-stream will use automatically when the primary errors out.

CREATE TABLE IF NOT EXISTS public.llm_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('mistral','openrouter','deepseek','ollama')),
  default_model text NOT NULL,
  fallback_provider text CHECK (fallback_provider IS NULL OR fallback_provider IN ('mistral','openrouter','deepseek','ollama')),
  fallback_model text,
  is_active boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active row at a time.
CREATE UNIQUE INDEX IF NOT EXISTS llm_config_active_unique
  ON public.llm_config (is_active)
  WHERE is_active = true;

ALTER TABLE public.llm_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can read llm_config" ON public.llm_config;
CREATE POLICY "Only admins can read llm_config"
  ON public.llm_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can write llm_config" ON public.llm_config;
CREATE POLICY "Only admins can write llm_config"
  ON public.llm_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed the production default so the system keeps working after deploy
-- even if the admin never opens the new panel. DeepSeek is the only LLM
-- secret configured in Supabase Edge Function Secrets (see ETAPA 9.1), so
-- seeding Mistral here would silently break agents without an explicit
-- model_id with "Mistral API not configured. Please contact support."
-- NOTE: deepseek-v4-flash is the V4 name (GA 2026-08-13). The retired
-- `deepseek-chat`/`deepseek-reasoner` names are rejected by the API.
INSERT INTO public.llm_config (provider, default_model, is_active, notes)
VALUES ('deepseek', 'deepseek/deepseek-v4-flash', true, 'Initial seed - DeepSeek V4 Flash is the only configured provider secret')
ON CONFLICT DO NOTHING;