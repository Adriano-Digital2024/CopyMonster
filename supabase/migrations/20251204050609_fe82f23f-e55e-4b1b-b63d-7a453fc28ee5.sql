-- Add preferred_language to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'auto';

-- Create agent_prompts table for storing versioned prompts
CREATE TABLE public.agent_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_slug text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  system_prompt text NOT NULL,
  output_structure text,
  limits jsonb DEFAULT '{"min_words": 100, "max_words": 500, "max_characters": null}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'active', 'archived')),
  created_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(agent_slug, version)
);

-- Create prompt_approvals table for approval history
CREATE TABLE public.prompt_approvals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id uuid NOT NULL REFERENCES public.agent_prompts(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'activated', 'archived')),
  performed_by uuid NOT NULL REFERENCES public.profiles(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_prompts
CREATE POLICY "Admins can view all prompts" ON public.agent_prompts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert prompts" ON public.agent_prompts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update prompts" ON public.agent_prompts
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete prompts" ON public.agent_prompts
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Active prompts readable by authenticated users (for chat)
CREATE POLICY "Authenticated users can view active prompts" ON public.agent_prompts
  FOR SELECT USING (status = 'active' AND auth.uid() IS NOT NULL);

-- RLS Policies for prompt_approvals
CREATE POLICY "Admins can view all approvals" ON public.prompt_approvals
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert approvals" ON public.prompt_approvals
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_agent_prompts_updated_at
  BEFORE UPDATE ON public.agent_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();