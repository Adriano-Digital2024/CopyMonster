-- =====================================================
-- MIGRAÇÃO: Sistema de Trial e Controle de Uso
-- =====================================================

-- 1. Adicionar campo trial_expires_at na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Alterar o default de credits de 100 para 20
ALTER TABLE public.profiles 
ALTER COLUMN credits SET DEFAULT 20;

-- 3. Criar tabela usage_logs para auditoria de consumo
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_slug TEXT,
  model_used TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS na tabela usage_logs
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para usage_logs
CREATE POLICY "Users can view their own usage logs" 
ON public.usage_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs" 
ON public.usage_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert usage logs" 
ON public.usage_logs 
FOR INSERT 
WITH CHECK (true);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires ON public.profiles(trial_expires_at);

-- 7. Atualizar a função handle_new_user para definir trial_expires_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile with trial settings
  INSERT INTO public.profiles (id, email, first_name, phone, credits, trial_expires_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    new.raw_user_meta_data->>'phone',
    20, -- 20 créditos gratuitos
    NOW() + INTERVAL '7 days' -- Trial de 7 dias
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  -- If this is the admin email, add admin role
  IF new.email = 'eusouadrianovieira@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin');
  END IF;
  
  RETURN new;
END;
$$;

-- 8. Definir trial_expires_at para usuários existentes que estão em free e não tem trial definido
UPDATE public.profiles 
SET trial_expires_at = created_at + INTERVAL '7 days'
WHERE subscription_status = 'free' 
AND trial_expires_at IS NULL;