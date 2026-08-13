-- ETAPA 9.2: Migrate DeepSeek model ids to the V4 lineup.
-- DeepSeek released the V4 series (GA 2026-08-13) and retired the legacy
-- `deepseek-chat` / `deepseek-reasoner` model names, which now return
-- 400/404 from the API. Agents/llm_config rows seeded with the old names
-- break chat-stream with an "AI Gateway error" (credit is refunded, but
-- the user gets no answer). This migration rewrites every existing row
-- to the equivalent V4 model id:
--   deepseek/deepseek-chat      -> deepseek/deepseek-v4-flash
--   deepseek/deepseek-reasoner -> deepseek/deepseek-v4-pro
-- Idempotent: safe to re-run, only touches rows that still reference the
-- retired names.

UPDATE public.llm_config
SET default_model = 'deepseek/deepseek-v4-flash',
    fallback_model = CASE
      WHEN fallback_model = 'deepseek/deepseek-chat' THEN 'deepseek/deepseek-v4-flash'
      WHEN fallback_model = 'deepseek/deepseek-reasoner' THEN 'deepseek/deepseek-v4-pro'
      ELSE fallback_model
    END,
    updated_at = now()
WHERE default_model IN ('deepseek/deepseek-chat', 'deepseek/deepseek-reasoner')
   OR fallback_model IN ('deepseek/deepseek-chat', 'deepseek/deepseek-reasoner');

UPDATE public.llm_config
SET default_model = 'deepseek/deepseek-v4-pro',
    updated_at = now()
WHERE default_model = 'deepseek/deepseek-reasoner';

UPDATE public.agents
SET model_id = CASE
      WHEN model_id = 'deepseek/deepseek-chat' THEN 'deepseek/deepseek-v4-flash'
      WHEN model_id = 'deepseek/deepseek-reasoner' THEN 'deepseek/deepseek-v4-pro'
      ELSE model_id
    END,
    updated_at = now()
WHERE model_id IN ('deepseek/deepseek-chat', 'deepseek/deepseek-reasoner');

-- Verify (informational).
SELECT 'llm_config' AS source, default_model, fallback_model, is_active
FROM public.llm_config
WHERE default_model LIKE 'deepseek/%'
ORDER BY is_active DESC, updated_at DESC;
SELECT 'agents' AS source, slug, model_id
FROM public.agents
WHERE model_id LIKE 'deepseek/%'
ORDER BY sort_order;