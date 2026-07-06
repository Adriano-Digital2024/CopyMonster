## Diagnóstico

A trigger `trg_mautic_sync_insert` dispara em novos cadastros, mas a função `notify_mautic_on_profile_change()` chama `extensions.http_post(...)` — que pertence à extensão `http`, **que não está instalada** neste projeto (só `pg_net` está). A chamada lança exceção, é engolida pelo `EXCEPTION WHEN OTHERS`, e a Edge Function `mautic-sync` nunca é invocada. Por isso os logs dela estão vazios.

As triggers do Sender e do Agentes funcionam porque usam `net.http_post` (pg_net), que está disponível.

## Correção

Recriar `public.notify_mautic_on_profile_change()` trocando `extensions.http_post` por `net.http_post`, mantendo exatamente o mesmo payload, a mesma URL (`.../functions/v1/mautic-sync`) e o mesmo header `Authorization: Bearer <anon key>`. Nenhuma trigger é recriada — só a função. Nada mais no projeto muda.

### SQL a executar

```sql
CREATE OR REPLACE FUNCTION public.notify_mautic_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _payload jsonb;
  _event_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event_type := 'new_user';
  ELSIF TG_OP = 'UPDATE' THEN
    _event_type := 'plan_update';
  END IF;

  _payload := jsonb_build_object(
    'type', _event_type,
    'record', jsonb_build_object(
      'email', NEW.email,
      'first_name', NEW.first_name,
      'phone', COALESCE(NEW.phone, ''),
      'subscription_status', NEW.subscription_status
    )
  );

  PERFORM net.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/mautic-sync',
    body := _payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXR1cGx0ZnZnd2VsaHplem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjIyNjUsImV4cCI6MjA3Njk5ODI2NX0.naM7i7VVD4RHGCI5FbTunNToZVZ-nDAP881VUa7WJBg'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[mautic-sync] Failed to queue HTTP request: %', SQLERRM;
  RETURN NEW;
END;
$function$;
```

## Validação

1. Cadastrar um usuário de teste no CopyMonster.
2. Ler os logs da Edge Function `mautic-sync` — deve aparecer `Event type: new_user` seguido de `Mautic contact created successfully`.
3. Conferir no Mautic se o contato apareceu com o campo `plan = Free`.

Se `mautic-sync` responder com `Mautic not connected` (tabela `mautic_tokens` vazia) ou 401, aí é outro problema (OAuth ainda não concluído) e trato em seguida — mas o motivo do silêncio atual é 100% a chamada `extensions.http_post`.

## Riscos

Zero para o resto do sistema: só substitui uma função. Triggers, `sender-sync`, `agentes-sync` e frontend não são tocados.