## Fix: Add `config_id` to Meta Business Login OAuth URL

### Problem

The Meta OAuth URL is missing the required `config_id` parameter for Facebook Login for Business. Without it, the Business Login flow fails silently on callback.

### Changes

**1. Store config_id as a Supabase secret**

- Add secret `META_BUSINESS_CONFIG_ID` = `1920808931973572`

**2. Update `supabase/functions/meta-oauth/index.ts**`

- Read `META_BUSINESS_CONFIG_ID` from env
- Append `&config_id=${businessConfigId}` to the OAuth URL (line 46)
- No other changes — token exchange, redirect_uri, scopes, graph endpoints remain untouched

### Add config_id to Meta Business Login OAuth URL

### 1️⃣ Criar Secret no Supabase

No projeto do Supabase:

**Settings → Edge Functions → Secrets**

Adicionar:

```
META_BUSINESS_CONFIG_ID=1920808931973572
```

---

### 2️⃣ Atualizar arquivo:

```
supabase/functions/meta-oauth/index.ts
```

### Alterações:

- Ler variável do ambiente:

```
const businessConfigId = Deno.env.get("META_BUSINESS_CONFIG_ID")
```

- Adicionar na URL de OAuth (linha onde monta o login):

```
&config_id=${businessConfigId}
```

---

## ✅ Resultado esperado

A URL final deverá ficar assim:

```
https://www.facebook.com/v19.0/dialog/oauth?
client_id=APP_ID
&redirect_uri=REDIRECT_URI
&scope=SCOPES
&response_type=code
&config_id=1920808931973572
```

---

# 🚨 Importante

Não alterar:

- scopes
- redirect_uri
- token exchange
- graph endpoints

Somente adicionar `config_id`. Result

OAuth URL will become:

```
...&response_type=code&config_id=1920808931973572
```