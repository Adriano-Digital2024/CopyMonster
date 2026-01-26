

## Plano de Correção: Traduções do Modal de Trial Expirado

### Problema Identificado

O popup de bloqueio de usuários após período de teste (`TrialExpiredModal`) exibe as chaves de tradução literalmente em vez do texto traduzido:
- `trial.expired.title`
- `trial.expired.description`
- `trial.upgrade.benefits`
- `trial.upgrade.benefit1`, `benefit2`, `benefit3`
- `trial.upgrade.button`

### Causa Raiz

O sistema i18n usa apenas o objeto `resources` do arquivo `src/i18n/config.ts` (linha 3064). As traduções de `trial` existem nos arquivos JSON separados (`src/i18n/locales/{lang}/dashboard.json`), mas esses arquivos **não são carregados** pelo i18n.

### Solução

Adicionar as traduções de `trial` diretamente no objeto `resources` do `src/i18n/config.ts` para os 3 idiomas (EN, PT, ES).

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/i18n/config.ts` | Adicionar seção `trial` dentro de `translation` para EN, PT e ES |

### Traduções a Adicionar

**INGLÊS (EN):**
```typescript
trial: {
  expired: {
    title: 'Your Trial Period Has Expired',
    description: 'Your 7-day free trial has ended. Upgrade to continue using all AI agents.',
  },
  noCredits: {
    title: 'Credits Exhausted',
    description: 'You have used all your available credits. Upgrade to continue creating content.',
  },
  upgrade: {
    benefits: 'What you get with an upgrade:',
    benefit1: 'Unlimited access to all AI agents',
    benefit2: 'Monthly credits renewed automatically',
    benefit3: 'Priority support and new features',
    button: 'Choose a Plan',
  },
},
```

**PORTUGUÊS (PT):**
```typescript
trial: {
  expired: {
    title: 'Seu Período de Teste Expirou',
    description: 'Seu período de teste gratuito de 7 dias terminou. Faça upgrade para continuar usando todos os agentes de IA.',
  },
  noCredits: {
    title: 'Créditos Esgotados',
    description: 'Você usou todos os seus créditos disponíveis. Faça upgrade para continuar criando conteúdo.',
  },
  upgrade: {
    benefits: 'O que você ganha com o upgrade:',
    benefit1: 'Acesso ilimitado a todos os agentes de IA',
    benefit2: 'Créditos mensais renovados automaticamente',
    benefit3: 'Suporte prioritário e novas funcionalidades',
    button: 'Escolher um Plano',
  },
},
```

**ESPANHOL (ES):**
```typescript
trial: {
  expired: {
    title: 'Tu Período de Prueba Ha Expirado',
    description: 'Tu período de prueba gratuito de 7 días ha terminado. Actualiza para seguir usando todos los agentes de IA.',
  },
  noCredits: {
    title: 'Créditos Agotados',
    description: 'Has usado todos tus créditos disponibles. Actualiza para seguir creando contenido.',
  },
  upgrade: {
    benefits: 'Lo que obtienes con la actualización:',
    benefit1: 'Acceso ilimitado a todos los agentes de IA',
    benefit2: 'Créditos mensuales renovados automáticamente',
    benefit3: 'Soporte prioritario y nuevas funcionalidades',
    button: 'Elegir un Plan',
  },
},
```

### Localização no config.ts

As traduções serão adicionadas logo após a seção `campaigns` (linha ~429) dentro do objeto `translation` para cada idioma.

### Resultado Esperado

Após a correção:
- Usuários com idioma **PT** verão: "Seu Período de Teste Expirou"
- Usuários com idioma **EN** verão: "Your Trial Period Has Expired"
- Usuários com idioma **ES** verão: "Tu Período de Prueba Ha Expirado"

### Garantias

- Nenhuma alteração de layout ou design
- Modal permanece funcional
- Todas as outras traduções permanecem intactas
- Retrocompatibilidade total

