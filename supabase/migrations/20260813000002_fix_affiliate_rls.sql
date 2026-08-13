-- =============================================================================
-- ETAPA 4: Corrigir RLS do programa de afiliados
-- =============================================================================
-- Problemas:
-- 1. affiliate.profiles não tem policy INSERT → o auto-cadastro do afiliado
--    bloqueado (não consegue criar a própria linha via supabase-js).
-- 2. affiliate.commission_rules está com RLS ENABLE mas ZERO policies → admin
--    não consegue ler/escrever regras pelo painel /admin/partners (RuleEngine).
--    Usuário também não consegue ler a regra vigente para exibir % no dashboard.
-- 3. As policies "Admins full access *" originais usam
--    (auth.jwt() ->> 'role') = 'admin' — mas nada no app injeta role='admin'
--    no JWT (AuthContext só deriva isAdmin client-side via user_roles), então
--    essas policies NUNCA concedem acesso e admin vê listas vazias / updates
--    silenciados. Bug confirmado.
--
-- Solução: unificar todas as admin policies para usar subquery em user_roles
-- (mesmo estilo que já funciona em audit_logs e no has_role RPC), tornar as
-- policies admin FOR ALL (INSERT+UPDATE+SELECT+DELETE), e adicionar as
-- policies faltantes.
--
-- Idempotente: todas DROP POLICY IF EXISTS antes de CREATE.
-- =============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1) affiliate.profiles — adicionar INSERT para auto-cadastro + admin FOR ALL
-- ────────────────────────────────────────────────────────────────────────────

-- Manter: "Users view own profile" (SELECT auth.uid()=user_id) — já existe.

-- Recriar admin como FOR ALL via user_roles (substitui a versão jwt-based).
DROP POLICY IF EXISTS "Admins full access profiles" ON affiliate.profiles;
CREATE POLICY "Admins full access profiles" ON affiliate.profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- NOVO: afiliado cria a própria profile (apenas com kyc_status=PENDING,
--       user_id = próprio auth.uid()). Não pode usar este INSERT para
--       auto-aprovar KYC (CHECK impede kyc_status='APPROVED').
DROP POLICY IF EXISTS "Affiliates self-register" ON affiliate.profiles;
CREATE POLICY "Affiliates self-register" ON affiliate.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND kyc_status = 'PENDING');

-- NOVO: afiliado pode atualizar a própria profile (limitado a campos seguros:
--       paypal_email, full_name, etc.). Como RLS não suporta column-level
--       CHECK, confiamos no mutate via UI/edge functions. O importante é
--       bloquear que outro user altere a minha profile.
DROP POLICY IF EXISTS "Affiliates update own profile" ON affiliate.profiles;
CREATE POLICY "Affiliates update own profile" ON affiliate.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 2) affiliate.commission_rules — adicionar admin FOR ALL + user SELECT vigente
-- ────────────────────────────────────────────────────────────────────────────

-- Admin pode tudo (ler histórico, criar nova versão, mudar is_current).
DROP POLICY IF EXISTS "Admins manage rules" ON affiliate.commission_rules;
CREATE POLICY "Admins manage rules" ON affiliate.commission_rules
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Usuário autenticado pode ler a regra vigente (PartnersDashboard mostra
-- percentage e min_payout_amount — precisa de SELECT ou dashboard quebra).
-- Restrito a is_current=true para não expor histórico de regras.
DROP POLICY IF EXISTS "Users read current rule" ON affiliate.commission_rules;
CREATE POLICY "Users read current rule" ON affiliate.commission_rules
  FOR SELECT TO authenticated
  USING (is_current = true);

-- ────────────────────────────────────────────────────────────────────────────
-- 3) affiliate.commissions — recriar admin FOR ALL via user_roles
-- ────────────────────────────────────────────────────────────────────────────

-- Manter: "Users view own commissions" (SELECT via EXISTS em profiles) — já existe.

DROP POLICY IF EXISTS "Admins full access commissions" ON affiliate.commissions;
CREATE POLICY "Admins full access commissions" ON affiliate.commissions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 4) finance.ledger_entries — recriar admin FOR ALL via user_roles
-- ────────────────────────────────────────────────────────────────────────────

-- Manter: "Users view own ledger" (SELECT via EXISTS) — já existe.

DROP POLICY IF EXISTS "Admins full access ledger" ON finance.ledger_entries;
CREATE POLICY "Admins full access ledger" ON finance.ledger_entries
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 5) finance.payout_requests — recriar admin FOR ALL via user_roles
-- ────────────────────────────────────────────────────────────────────────────

-- Manter: "Users view own payout requests" (SELECT via EXISTS) — já existe.

DROP POLICY IF EXISTS "Admins full access payouts" ON finance.payout_requests;
CREATE POLICY "Admins full access payouts" ON finance.payout_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────────────
-- 6) affiliate.notifications — adicionar admin SELECT (para suporte admin)
-- ────────────────────────────────────────────────────────────────────────────

-- Manter: policy existente do afiliado ver as próprias (já existe).

DROP POLICY IF EXISTS "Admins read all notifications" ON affiliate.notifications;
CREATE POLICY "Admins read all notifications" ON affiliate.notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────────────
-- Verificação (informativo, seguro rodar)
-- ────────────────────────────────────────────────────────────────────────────
SELECT schemaname AS s, tablename AS t, policyname AS p, cmd, roles
FROM pg_policies
WHERE schemaname IN ('affiliate','finance')
ORDER BY tablename, policyname;