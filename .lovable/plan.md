## Objetivo

Isolar exatamente em qual etapa o valor do campo `plan` é perdido no fluxo Supabase → `mautic-sync` → API do Mautic. Nenhuma função será removida, nenhum código será refatorado nesta etapa. Apenas diagnóstico ao vivo com evidências.

## Regras desta fase

- Não excluir `reset-trial`.
- Não excluir `mautic-bulk-sync`.
- Não alterar `mautic-sync`, `mautic-callback`, triggers ou migrations.
- Nenhuma mudança de arquitetura.
- Todas as observações vêm de execução real, não suposição.

## Passos de diagnóstico

1. **Escolher um contato de teste real**
   - Usar um dos 5 emails já sincronizados (por padrão, `wahojav876@exespay.com`).
   - Confirmar no `profiles` o `subscription_status` atual (esperado `free`).

2. **Disparar `mautic-sync` de forma controlada (sem alterar dados)**
   - Chamar diretamente o endpoint deployado com:
     ```json
     {
       "type": "plan_update",
       "record": {
         "email": "<email de teste>",
         "first_name": "<nome atual>",
         "phone": "<telefone atual>",
         "subscription_status": "free"
       }
     }
     ```
   - Capturar:
     - status HTTP retornado por `mautic-sync`;
     - corpo completo da resposta da função.

3. **Coletar os logs desta execução em `mautic-sync`**
   - Buscar as linhas do log correspondentes a esse email, incluindo:
     - `Event type` recebido;
     - `Mapped subscription_status ... to plan ...`;
     - payload enviado ao Mautic (`Creating/Updating Mautic contact with payload`);
     - resposta bruta da API do Mautic (`Create/Update contact response`).

4. **Ler o contato diretamente do Mautic para confirmar persistência**
   - Fazer uma segunda chamada usando o mesmo caminho já implementado (`GET /api/contacts?search=email:<email>`), aproveitando o mesmo token OAuth já armazenado.
   - Extrair da resposta:
     - `id` do contato;
     - valor real do campo customizado `plan`;
     - valores atuais de `firstname`, `email`, `phone`.
   - Comparar com o que a função disse ter enviado.

5. **Repetir o teste para um segundo estado**
   - Simular um `plan_update` com `subscription_status = "pro"` (somente no payload da chamada de teste — sem alterar `profiles`).
   - Executar os passos 2 a 4 novamente.
   - Verificar se o Mautic passa a mostrar `plan = Pro` para o contato, ou se permanece no valor anterior.

6. **Comparar com o gatilho automático via banco**
   - Consultar as respostas recentes em `net._http_response` para confirmar que chamadas oriundas dos triggers `trg_mautic_sync_insert` / `trg_mautic_sync_update` estão realmente chegando em `mautic-sync` com status 2xx.
   - Cruzar com os logs da função para o mesmo timestamp.

## O que a análise vai responder de forma objetiva

- Se `mautic-sync` está efetivamente sendo executado (sim/não, com evidência).
- Qual é o payload exato enviado ao Mautic (com o campo `plan` e seu valor).
- Qual é a resposta bruta da API do Mautic (status + corpo).
- Se, na leitura seguinte do contato, o campo `plan` foi realmente persistido.
- Em qual etapa exata o valor de `plan` se perde:
  - a) `mautic-sync` não é chamado;
  - b) `mautic-sync` é chamado mas envia `plan` errado/vazio;
  - c) `mautic-sync` envia `plan` correto, mas a API do Mautic responde erro/ignora;
  - d) A API aceita, mas o campo customizado não é o `plan` correto (alias divergente, campo desativado, etc.);
  - e) Update por email não encontra o contato e o comportamento cai em `create` ineficaz.

## Entrega desta fase

Um relatório com:
- Email testado.
- Requisição enviada a `mautic-sync`.
- Resposta de `mautic-sync`.
- Logs relevantes de `mautic-sync`.
- Payload real enviado ao Mautic.
- Resposta bruta da API do Mautic.
- Leitura pós-sync do contato no Mautic com o valor real de `plan`.
- Conclusão apontando a etapa exata da falha.

## Próxima fase (somente após sua aprovação da causa raiz)

Só depois deste diagnóstico, e com sua aprovação explícita, será proposta a correção definitiva. Nesta fase nenhuma função é removida e nenhum código é alterado.