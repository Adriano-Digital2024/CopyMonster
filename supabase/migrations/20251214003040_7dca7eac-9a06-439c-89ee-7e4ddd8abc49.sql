-- Create table for complete positioning mappings
CREATE TABLE public.positioning_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Meu Posicionamento',
  status TEXT NOT NULL DEFAULT 'in_progress',
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Extracted blocks for easy querying
  block_1_audience TEXT,
  block_2_pain_points TEXT,
  block_3_solution TEXT,
  block_4_differentiators TEXT,
  block_5_awareness_stage TEXT,
  block_6_urgency TEXT,
  block_7_social_proof TEXT,
  block_8_objections TEXT,
  block_9_emotional_connection TEXT,
  block_10_transformation TEXT,
  block_11_voice TEXT,
  block_12_promises TEXT,
  
  completed_blocks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.positioning_mappings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own mappings"
ON public.positioning_mappings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mappings"
ON public.positioning_mappings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings"
ON public.positioning_mappings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings"
ON public.positioning_mappings
FOR DELETE
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all mappings"
ON public.positioning_mappings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_positioning_mappings_updated_at
BEFORE UPDATE ON public.positioning_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_positioning_mappings_user_id ON public.positioning_mappings(user_id);
CREATE INDEX idx_positioning_mappings_status ON public.positioning_mappings(status);