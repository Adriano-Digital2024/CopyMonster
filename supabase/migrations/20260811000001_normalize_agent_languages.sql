-- ETAPA 3: Normalize agent.language to the codes accepted by chat-stream
-- Backend only allows ['pt-BR','en','es'] (see chat-stream/index.ts:383).
-- This is a non-destructive idempotent migration.

UPDATE public.agents SET language = 'en' WHERE language = 'en-US';
UPDATE public.agents SET language = 'es' WHERE language = 'es-ES';

-- Add a CHECK constraint to prevent regression.
ALTER TABLE public.agents
  DROP CONSTRAINT IF EXISTS agents_language_check;
ALTER TABLE public.agents
  ADD CONSTRAINT agents_language_check
  CHECK (language IS NULL OR language IN ('pt-BR', 'en', 'es'));