

## Auditoria Pre-Producao e Correcao do Contorno Branco

---

### 1. Diagnostico do Contorno Branco nos Cards

**Causa raiz identificada:**

O contorno visivel nos cards e causado pela combinacao de dois fatores que SEMPRE existiram no codigo, mas ficam mais visiveis em telas de alto contraste:

- **Componente Card** (`src/components/ui/card.tsx` linha 6): usa classe `border` do Tailwind que aplica `border-width: 1px`
- **Regra global** (`src/index.css` linha 113): `* { @apply border-border }` aplica `border-color: hsl(var(--border))` a TODOS os elementos
- **Variavel CSS** (`src/index.css` linha 37): `--border: 240 10% 15%` (15% de luminosidade)
- **Background do card**: `--card: 240 10% 7%` (7% de luminosidade)

O contraste entre 15% e 7% cria uma borda visivel. NAO houve regressao nas ultimas alteracoes (nenhum arquivo de estilo foi modificado). Porem, a borda esta mais acentuada do que o desejavel para o design premium escuro.

**Correcao proposta:**

Escurecer a variavel `--border` de `240 10% 15%` para `240 10% 10%` no `:root` (dark mode). Isso reduz o contraste mantendo a borda sutil. Tambem ajustar `--input` para manter consistencia.

**Arquivo:** `src/index.css` linhas 37-38
```text
ANTES:  --border: 240 10% 15%;  --input: 240 10% 15%;
DEPOIS: --border: 240 10% 10%;  --input: 240 10% 10%;
```

---

### 2. Problemas Adicionais Encontrados

#### 2a. ThemeProvider Duplicado (Risco medio)

O ThemeProvider esta instanciado em DOIS lugares:
- `src/main.tsx` linha 9
- `src/App.tsx` linha 53

Ambos chamam `document.documentElement.classList.add(theme)`. Embora ambos usem defaultTheme="dark" e nao cause bug visivel, e uma duplicacao desnecessaria que pode causar conflitos sutis.

**Correcao:** Remover o ThemeProvider de `src/main.tsx` (manter apenas o de `App.tsx` que esta dentro do AuthProvider e pode acessar preferencias do usuario).

#### 2b. Aviso de Acessibilidade - SheetContent sem Titulo (Risco baixo)

Console mostra: `DialogContent requires a DialogTitle for screen readers`

Causa: O `SheetContent` (mobile sidebar) em `DashboardLayout.tsx` (linha 156) e `AdminLayout.tsx` (linha 152) nao possui `SheetTitle`.

**Correcao:** Adicionar `SheetTitle` com `VisuallyHidden` para acessibilidade sem impacto visual.

---

### 3. Checklist Pre-Deploy

| Item | Status | Observacao |
|------|--------|------------|
| Rotas orfas | OK | Nenhuma rota aponta para componente inexistente |
| Imports invalidos | OK | Headlines e Insights removidos corretamente |
| Console errors | 1 WARNING | SheetContent sem titulo (correcao incluida) |
| Sistema i18n | OK | 3 idiomas consistentes apos remocoes |
| useDnaGuard | OK | Limites 1/1/10/50 alinhados com cards de planos |
| RLS/Permissoes | OK | Coluna internal_role coberta pela RLS existente |
| Variaveis de ambiente | OK | .env e .env.example presentes |
| Build production | A testar | Apos correcoes |
| Componentes nao utilizados | OK | Nenhum componente orfao encontrado |
| Edge functions | OK | Nenhuma alteracao necessaria |

---

### 4. Ordem de Execucao

1. **`src/index.css`**: Escurecer `--border` e `--input` de 15% para 10% no `:root`
2. **`src/main.tsx`**: Remover ThemeProvider duplicado (manter apenas wrapper simples)
3. **`src/components/layouts/DashboardLayout.tsx`**: Adicionar SheetTitle hidden no mobile sidebar
4. **`src/components/layouts/AdminLayout.tsx`**: Adicionar SheetTitle hidden no mobile sidebar

### 5. Riscos

- **Zero risco funcional** - alteracoes sao puramente visuais e de acessibilidade
- A mudanca no `--border` afeta todas as bordas do dark mode (resultado: bordas mais sutis e premium)
- Nenhuma logica de negocio e tocada

