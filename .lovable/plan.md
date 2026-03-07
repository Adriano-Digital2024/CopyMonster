

## Diagnóstico: Dois problemas encontrados

### Problema 1: Meta App em modo Teste (CAUSA PRINCIPAL do erro no Facebook)

O app Meta está em modo **Development/Test**. Isso significa que apenas usuários cadastrados como desenvolvedores ou testadores no painel Meta for Developers podem completar o fluxo OAuth. Qualquer outro usuário verá um erro dentro do Facebook.

**Solução (manual, fora do Lovable):**
1. Acesse https://developers.facebook.com → seu App
2. Vá em **App Review** ou **App Mode** e mude para **Live**
3. Certifique-se que todas as permissões necessárias (`ads_read`, `read_insights`, `instagram_basic`, `instagram_manage_insights`) estão aprovadas ou disponíveis no modo Business

### Problema 2: `pgp_sym_encrypt` falha na produção

Os logs do `integration_logs` mostram que um usuário (`9c989c73...`) conseguiu completar o OAuth com o Facebook, mas o token falhou ao ser salvo:

```
error: "function pgp_sym_encrypt(text, text) does not exist"
step: "store_token"
```

A extensão `pgcrypto` existe no banco (confirmado), mas a função `upsert_user_integration` usa `pgp_sym_encrypt` sem qualificar o schema. O `pgcrypto` está instalado no schema `extensions` (OID 16388), não no `public`. Como a function usa `SET search_path TO 'public'`, ela não encontra `pgp_sym_encrypt`.

**Solução (SQL a executar no Supabase):**

Atualizar a function para qualificar as chamadas com `extensions.`:

```sql
CREATE OR REPLACE FUNCTION public.upsert_user_integration(...)
  -- trocar pgp_sym_encrypt(...) por extensions.pgp_sym_encrypt(...)
```

E fazer o mesmo na function `get_decrypted_token`:
```sql
  -- trocar pgp_sym_decrypt(...) por extensions.pgp_sym_decrypt(...)
```

### Resumo das Ações

| Ação | Onde | Tipo |
|------|------|------|
| Mudar Meta App para modo **Live** | Meta for Developers | Manual |
| Corrigir `upsert_user_integration` para usar `extensions.pgp_sym_encrypt` | Supabase SQL | Migration |
| Corrigir `get_decrypted_token` para usar `extensions.pgp_sym_decrypt` | Supabase SQL | Migration |

Nenhuma alteração de código frontend ou edge function é necessária.

