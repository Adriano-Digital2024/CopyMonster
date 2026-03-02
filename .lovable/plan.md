

## Implementar evento Purchase via Meta Conversions API no stripe-webhook

### O que sera feito

Adicionar uma chamada HTTP a Meta Conversions API dentro do case `checkout.session.completed` do `stripe-webhook`, disparando o evento `Purchase` no servidor sempre que uma compra for confirmada pelo Stripe.

### Pre-requisito: armazenar o Access Token

O Meta Access Token precisa ser salvo como secret no Supabase com o nome `META_CONVERSIONS_API_TOKEN`. Vou solicitar via ferramenta de secrets.

### Alteracao no stripe-webhook

Dentro do case `checkout.session.completed`, apos atualizar o perfil do usuario com sucesso, adicionar uma funcao que faz POST para:

```
https://graph.facebook.com/v21.0/848000381146545/events
```

Payload do evento:
- `event_name`: `Purchase`
- `event_time`: timestamp atual
- `action_source`: `website`
- `user_data`: email do usuario (hashed com SHA-256, exigencia do Meta)
- `custom_data`: `value` (preco do plano), `currency` (BRL/USD conforme plano), `content_ids` (plan_id)

### Mapeamento de valores por plano

Os valores serao extraidos do `session.amount_total` do Stripe (em centavos), convertido para valor real. Isso garante precisao independente de cupons ou descontos.

### Arquivos a alterar
1. **`supabase/functions/stripe-webhook/index.ts`** — adicionar funcao `sendMetaPurchaseEvent()` e chama-la no `checkout.session.completed`

### Seguranca
- O Access Token fica apenas no servidor (Supabase secrets), nunca exposto no frontend
- O email e hasheado com SHA-256 antes de enviar ao Meta (requisito da API)
- Falha no envio ao Meta nao bloqueia o fluxo do webhook (try/catch isolado)

