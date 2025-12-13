-- Drop and recreate tone constraint with all needed values
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_tone_check;

ALTER TABLE public.agents ADD CONSTRAINT agents_tone_check 
  CHECK (tone IN ('professional', 'friendly', 'casual', 'persuasive', 'creative', 'urgent', 'empathetic', 'exclusive', 'personal', 'educational', 'conversational'));