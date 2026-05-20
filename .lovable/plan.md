

## Diagnóstico

Confirmei via SQL e logs:

1. **Trigger ausente**: `SELECT … FROM information_schema.triggers WHERE event_object_table = 'profiles'` retornou **vazio**. Nenhum trigger existe na tabela `profiles`, nem o `trg_agentes_sync_insert`, nem o `trg_agentes_sync_update`, nem o equivalente do `sender-sync`.
2. **Função existe mas órfã**: `notify_agentes_on_profile_change()` está criada no banco, mas sem trigger não é chamada.
3. **Logs vazios**: A edge function `agentes-sync` nunca recebeu nenhuma chamada (zero logs). Isso confirma que o trigger nunca disparou.
4. **Usuário novo não sincronizou**: `emanueleeusou@gmail.com` (criado hoje 19/04) está em `profiles`, mas não chegou em `leads_agentes`.

## Causa raiz

A migration anterior criou a função `notify_agentes_on_profile_change()`, mas os comandos `CREATE TRIGGER` não foram aplicados (provavelmente um erro silencioso na migration ou foram omitidos). Sem o trigger, qualquer INSERT/UPDATE em `profiles` não dispara a chamada HTTP para `agentes-sync`.

## Plano de correção

### 1. Criar os triggers ausentes em `profiles` (migration)

```sql
-- Trigger para novos cadastros
CREATE TRIGGER trg_agentes_sync_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_agentes_on_profile_change();

-- Trigger para mudanças de plano/dados relevantes
CREATE TRIGGER trg_agentes_sync_update
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_agentes_on_profile_change();
```

A função `notify_agentes_on_profile_change()` já tem a lógica correta:
- Em INSERT → envia `type: 'new_lead'`
- Em UPDATE → só dispara se `subscription_status`, `trial_expires_at`, `first_name`, `phone` ou `email` mudaram

### 2. Backfill do usuário existente que não foi sincronizado

Após criar os triggers, executar um `UPDATE` no usuário `emanueleeusou@gmail.com` que não passou pela sincronização (toco em um campo que dispara, ex.: `first_name = first_name`) — não, isso não dispara porque o `IS DISTINCT FROM` retorna falso. Vou usar uma abordagem mais segura:

```sql
-- Reenviar manualmente via net.http_post para o profile órfão
SELECT net.http_post(
  url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/agentes-sync',
  body := jsonb_build_object(
    'type', 'new_lead',
    'record', jsonb_build_object(
      'id', id, 'email', email, 'first_name', first_name,
      'phone', COALESCE(phone, ''), 'subscription_status', subscription_status,
      'created_at', created_at, 'trial_expires_at', trial_expires_at
    )
  ),
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer <anon_key>'
  )
)
FROM public.profiles
WHERE email = 'emanueleeusou@gmail.com';
```

### 3. Validação após aplicar

- Verificar `information_schema.triggers` para confirmar que os 2 triggers aparecem.
- Cadastrar um novo usuário de teste no CopyMonster.
- Conferir logs da `agentes-sync` (devem aparecer agora).
- Conferir logs da `sync-lead` no projeto destino.
- Confirmar registro na tabela `leads_agentes`.

### Observação sobre o destino

Se mesmo com os triggers funcionando o lead não chegar em `leads_agentes`, o problema estará no projeto destino:
- Função `sync-lead` pode não estar deployada
- `AGENTES_SERVICE_ROLE_KEY` pode estar incorreta (precisa ser a `service_role` do projeto `alfedcsoicoheqargisr`, não a do CopyMonster)
- Tabela `leads_agentes` pode não ter sido criada com os campos esperados

Os logs da `agentes-sync` vão mostrar exatamente qual desses casos é, pois ela loga o status HTTP e o corpo de resposta da `sync-lead`.

