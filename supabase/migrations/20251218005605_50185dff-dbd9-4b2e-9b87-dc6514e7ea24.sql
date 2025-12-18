-- Correção MENOR: 6 agentes com headers ## no output_structure
-- Substituir ## por títulos numerados simples

-- 1. VSL Monster
UPDATE agents SET
  output_structure = 'ESTRUTURA DE SAÍDA - VSL (VIDEO SALES LETTER)

1. GANCHO INICIAL (0-30 segundos)
[Abertura impactante que prende atenção imediatamente]

2. IDENTIFICAÇÃO DO PROBLEMA
[Descrição vívida da dor do público]

3. AGITAÇÃO
[Amplificação das consequências de não resolver o problema]

4. APRESENTAÇÃO DA SOLUÇÃO
[Introdução do produto/serviço como a resposta]

5. BENEFÍCIOS E TRANSFORMAÇÃO
[Lista de benefícios com foco em resultados]

6. PROVA SOCIAL
[Depoimentos, casos de sucesso, números]

7. OFERTA IRRESISTÍVEL
[Apresentação do valor, bônus, garantia]

8. CHAMADA PARA AÇÃO
[CTA claro e urgente]

REGRAS: Títulos numerados simples. Zero emojis, asteriscos ou hashtags. Parágrafos profissionais.'
WHERE slug = 'vsl-monster';

-- 2. Sales Page Monster
UPDATE agents SET
  output_structure = 'ESTRUTURA DE SAÍDA - PÁGINA DE VENDAS

1. HEADLINE PRINCIPAL
[Promessa central poderosa]

2. SUBHEADLINE
[Complemento que reforça a promessa]

3. LEAD/ABERTURA
[Parágrafos iniciais que conectam com o leitor]

4. PROBLEMA E AGITAÇÃO
[Descrição detalhada da dor]

5. SOLUÇÃO E BENEFÍCIOS
[Apresentação do produto com benefícios claros]

6. PROVA SOCIAL
[Depoimentos e resultados]

7. OFERTA E PREÇO
[Apresentação do valor e justificativa]

8. GARANTIA
[Reversão de risco]

9. BÔNUS
[Itens adicionais de valor]

10. CTA E URGÊNCIA
[Chamada para ação com gatilhos de escassez]

11. FAQ
[Perguntas frequentes]

12. PS/FECHAMENTO
[Reforço final da oferta]

REGRAS: Títulos numerados simples. Zero emojis, asteriscos ou hashtags. Copy persuasivo e profissional.'
WHERE slug = 'sales-page-monster';

-- 3. Email Monster
UPDATE agents SET
  output_structure = 'ESTRUTURA DE SAÍDA - SEQUÊNCIA DE EMAILS

Para cada email:

EMAIL [NÚMERO] - [OBJETIVO DO EMAIL]

Assunto: [Linha de assunto]

Corpo:
[Conteúdo completo do email em parágrafos fluidos]

CTA: [Chamada para ação]

---

EXEMPLO DE FORMATAÇÃO:

EMAIL 1 - BOAS-VINDAS

Assunto: Bem-vindo! Seu primeiro passo para [resultado]

Corpo:
Olá [Nome],

Que bom ter você aqui...

[Continuação do email]

CTA: Clique aqui para começar

REGRAS: Títulos simples sem markdown. Zero emojis. Emails prontos para copiar e usar.'
WHERE slug = 'email-monster';

-- 4. Ads Monster
UPDATE agents SET
  output_structure = 'ESTRUTURA DE SAÍDA - ANÚNCIOS

Para cada anúncio:

ANÚNCIO [NÚMERO] - [PLATAFORMA/OBJETIVO]

Headline: [Título do anúncio]

Texto Principal:
[Copy do anúncio]

CTA: [Chamada para ação]

---

VARIAÇÕES INCLUÍDAS:
- Anúncios de topo de funil (awareness)
- Anúncios de meio de funil (consideração)
- Anúncios de fundo de funil (conversão)
- Variações de headline para teste A/B

REGRAS: Formatação limpa e simples. Zero emojis no copy. Anúncios prontos para implementar.'
WHERE slug = 'ads-monster';

-- 5. Short Monster
UPDATE agents SET
  output_structure = 'ESTRUTURA DE SAÍDA - CONTEÚDO CURTO

1. HOOK (Gancho)
[Frase de abertura que prende atenção em 3 segundos]

2. DESENVOLVIMENTO
[Conteúdo principal conciso e impactante]

3. CTA/FECHAMENTO
[Chamada para ação ou conclusão memorável]

FORMATOS ENTREGUES:
- Scripts para Reels/TikTok
- Legendas para posts
- Threads/Carrosséis
- Stories com sequência

REGRAS: Conteúdo direto e impactante. Zero emojis excessivos. Linguagem autêntica e conversacional.'
WHERE slug = 'short-monster';

-- 6. Headline Monster
UPDATE agents SET
  output_structure = 'ESTRUTURA DE SAÍDA - HEADLINES

CATEGORIA 1: HEADLINES DE CURIOSIDADE
1. [Headline]
2. [Headline]
3. [Headline]

CATEGORIA 2: HEADLINES DE BENEFÍCIO
1. [Headline]
2. [Headline]
3. [Headline]

CATEGORIA 3: HEADLINES DE URGÊNCIA
1. [Headline]
2. [Headline]
3. [Headline]

CATEGORIA 4: HEADLINES DE PROVA SOCIAL
1. [Headline]
2. [Headline]
3. [Headline]

CATEGORIA 5: HEADLINES DE PROBLEMA/SOLUÇÃO
1. [Headline]
2. [Headline]
3. [Headline]

REGRAS: Headlines limpas sem pontuação excessiva. Zero emojis. Variedade de ângulos e abordagens.'
WHERE slug = 'headline-monster';