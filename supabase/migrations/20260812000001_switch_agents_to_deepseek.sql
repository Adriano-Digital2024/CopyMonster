-- ETAPA 9.1: Switch all active agents to DeepSeek as the default provider.
-- Rationale: DEEPSEEK_API_KEY is the only LLM secret configured in production
-- Supabase Edge Function Secrets. The previous seed used mistralai/mistral-large-latest,
-- which requires MISTRAL_API_KEY (not set) and therefore broke chat-stream with
-- "Mistral API not configured. Please contact support."
--
-- This update switches every active agent to deepseek/deepseek-v4-flash (V4 GA,
-- 2026-08-13) which the llm-router resolves via the DeepSeek OpenAI-compatible
-- endpoint using DEEPSEEK_API_KEY. Per-agent model_id remains the source of truth
-- (the admin /providers panel intentionally only applies to agents without model_id).
--
-- Rollback: UPDATE public.agents SET model_id = 'mistralai/mistral-large-latest'
--           WHERE is_active = true;

UPDATE public.agents
SET model_id = 'deepseek/deepseek-v4-flash',
    updated_at = now()
WHERE is_active = true
  AND (model_id IS NULL OR model_id LIKE 'mistralai/%' OR model_id LIKE 'mistral/%');

-- Verify the switch (informational; safe to re-run, idempotent).
SELECT slug, model_id
FROM public.agents
WHERE is_active = true
ORDER BY sort_order;