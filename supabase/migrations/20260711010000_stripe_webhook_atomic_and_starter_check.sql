-- ============================================================================
-- ETAPA 2: Stripe webhook atomicidade + CHECK constraint de 'starter'
-- 1. Adiciona 'starter' ao CHECK constraint de subscription_status
-- 2. Cria RPC atômica process_stripe_webhook_event que combina idempotência
--    + mutação em uma única transação (elimina TOCTOU)
-- ============================================================================

-- ============================================================================
-- 1. Adicionar 'starter' ao CHECK constraint de subscription_status
-- ============================================================================

-- O nome do constraint original é gerado automaticamente pelo PostgreSQL.
-- Precisamos encontrá-lo e droppá-lo dinamicamente.
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%subscription_status%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', v_constraint_name);
    RAISE NOTICE 'Dropped constraint: %', v_constraint_name;
  ELSE
    RAISE NOTICE 'No subscription_status CHECK constraint found (already dropped?)';
  END IF;
END $$;

-- Recriar com 'starter' incluído
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('free', 'starter', 'pro', 'legend'));

-- ============================================================================
-- 2. RPC atômica: process_stripe_webhook_event
--    Combina idempotência (INSERT ON CONFLICT) + mutação em UMA transação.
--    Se a mutação falhar, o INSERT no webhook_events também é desfeito →
--    Stripe retenta. Se o evento já foi processado, retorna already_processed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_plan_id text DEFAULT NULL,
  p_credits_to_set int DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL,
  p_attempt_count int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_current_status text;
  v_renew_credits int;
  v_plan_credits jsonb := jsonb_build_object(
    'starter', 1000,
    'pro', 5000,
    'legend', 15000
  );
BEGIN
  -- Passo 1: Idempotência atômica — INSERT ON CONFLICT DO NOTHING
  -- Se o evento já foi processado, não insere nenhuma linha.
  INSERT INTO public.webhook_events (event_id)
  VALUES (p_event_id)
  ON CONFLICT (event_id) DO NOTHING;

  IF NOT FOUND THEN
    -- Evento já processado — retorna sem fazer nada
    RETURN jsonb_build_object(
      'already_processed', true,
      'event_id', p_event_id
    );
  END IF;

  -- Passo 2: Dispatch baseado no tipo de evento
  -- Tudo dentro da mesma transação — se a mutação falhar, o INSERT
  -- no webhook_events também é desfeito (ROLLBACK), e Stripe retenta.
  CASE p_event_type
    WHEN 'checkout.session.completed' THEN
      -- Validação de parâmetros
      IF p_user_id IS NULL OR p_plan_id IS NULL THEN
        RAISE EXCEPTION 'checkout.session.completed requires p_user_id and p_plan_id';
      END IF;

      -- Verificar se o perfil existe
      SELECT id INTO v_profile_id FROM public.profiles WHERE id = p_user_id;
      IF v_profile_id IS NULL THEN
        -- Perfil não existe — nada a fazer. Evento já registrado como processado.
        RETURN jsonb_build_object(
          'already_processed', false,
          'event_id', p_event_id,
          'warning', 'Profile not found for user_id'
        );
      END IF;

      -- Mutação atômica: set status + overwrite credits + set customer_id + clear trial
      UPDATE public.profiles
      SET subscription_status = p_plan_id,
          credits = COALESCE(p_credits_to_set, 150),
          stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
          trial_expires_at = NULL
      WHERE id = p_user_id;

      RETURN jsonb_build_object(
        'already_processed', false,
        'event_id', p_event_id,
        'action', 'checkout_completed',
        'user_id', p_user_id,
        'plan_id', p_plan_id,
        'credits', COALESCE(p_credits_to_set, 150)
      );

    WHEN 'customer.subscription.deleted' THEN
      -- Encontrar usuário pelo stripe_customer_id
      IF p_stripe_customer_id IS NULL THEN
        RAISE EXCEPTION 'customer.subscription.deleted requires p_stripe_customer_id';
      END IF;

      SELECT id INTO v_profile_id
      FROM public.profiles
      WHERE stripe_customer_id = p_stripe_customer_id;

      IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object(
          'already_processed', false,
          'event_id', p_event_id,
          'warning', 'No profile found for stripe_customer_id'
        );
      END IF;

      -- Downgrade para free + 20 créditos + 7 dias de trial
      UPDATE public.profiles
      SET subscription_status = 'free',
          credits = 20,
          trial_expires_at = NOW() + INTERVAL '7 days'
      WHERE id = v_profile_id;

      RETURN jsonb_build_object(
        'already_processed', false,
        'event_id', p_event_id,
        'action', 'subscription_deleted',
        'user_id', v_profile_id
      );

    WHEN 'invoice.payment_succeeded' THEN
      -- Apenas renovações (não pagamento inicial)
      IF p_attempt_count IS NULL OR p_attempt_count = 0 THEN
        -- Verificar se é subscription_cycle via flag simplificada
        -- (o edge function só chama este case para billing_reason = subscription_cycle)
        NULL;
      END IF;

      IF p_stripe_customer_id IS NULL THEN
        RAISE EXCEPTION 'invoice.payment_succeeded requires p_stripe_customer_id';
      END IF;

      SELECT id, subscription_status INTO v_profile_id, v_current_status
      FROM public.profiles
      WHERE stripe_customer_id = p_stripe_customer_id;

      IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object(
          'already_processed', false,
          'event_id', p_event_id,
          'warning', 'No profile found for stripe_customer_id'
        );
      END IF;

      -- Overwrite credits para o montante do plano atual
      v_renew_credits := COALESCE(
        (v_plan_credits ->> v_current_status)::int,
        150
      );

      UPDATE public.profiles
      SET credits = v_renew_credits
      WHERE id = v_profile_id;

      RETURN jsonb_build_object(
        'already_processed', false,
        'event_id', p_event_id,
        'action', 'renewal',
        'user_id', v_profile_id,
        'credits', v_renew_credits
      );

    WHEN 'invoice.payment_failed' THEN
      IF p_stripe_customer_id IS NULL THEN
        RAISE EXCEPTION 'invoice.payment_failed requires p_stripe_customer_id';
      END IF;

      SELECT id INTO v_profile_id
      FROM public.profiles
      WHERE stripe_customer_id = p_stripe_customer_id;

      IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object(
          'already_processed', false,
          'event_id', p_event_id,
          'warning', 'No profile found for stripe_customer_id'
        );
      END IF;

      -- Após 3 tentativas falhadas, downgrade para free sem créditos
      IF p_attempt_count IS NOT NULL AND p_attempt_count >= 3 THEN
        UPDATE public.profiles
        SET subscription_status = 'free',
            credits = 0,
            trial_expires_at = NULL
        WHERE id = v_profile_id;

        RETURN jsonb_build_object(
          'already_processed', false,
          'event_id', p_event_id,
          'action', 'payment_failed_downgrade',
          'user_id', v_profile_id
        );
      ELSE
        RETURN jsonb_build_object(
          'already_processed', false,
          'event_id', p_event_id,
          'action', 'payment_failed_warning',
          'user_id', v_profile_id,
          'attempt_count', p_attempt_count
        );
      END IF;

    ELSE
      -- Evento não relevante — já registrado como processado para evitar retries
      RETURN jsonb_build_object(
        'already_processed', false,
        'event_id', p_event_id,
        'action', 'ignored',
        'event_type', p_event_type
      );
  END CASE;
END;
$$;

-- ============================================================================
-- 3. Permissões: apenas service_role pode executar a RPC
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.process_stripe_webhook_event(
  text, text, uuid, text, int, text, int
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_stripe_webhook_event(
  text, text, uuid, text, int, text, int
) TO service_role;