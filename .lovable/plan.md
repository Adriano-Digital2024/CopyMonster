

## Diagnóstico: Bordas dos Cards

### O que está acontecendo

O CSS está com `--border: 240 10% 14%` para dark mode. Embora 14% seja "escuro" em termos absolutos, sobre um fundo de apenas 3.9% de luminosidade, a diferença relativa (3.5x mais claro) cria uma borda bastante perceptível — que o olho humano interpreta como "branca" em contraste com o fundo quase preto.

### Por que isso "volta" a cada atualização

Toda vez que o `src/index.css` é editado (via `... keep existing code`), existe risco de os valores serem resetados para defaults do shadcn/ui (que usa `baseColor: "slate"` com bordas mais claras). O problema é que não existe proteção contra isso.

### Solução (2 ações)

**1. Reduzir a luminosidade da borda no dark mode**

Alterar em `src/index.css`:
- `--border: 240 10% 14%` → `--border: 240 10% 10%`  
- `--input: 240 10% 14%` → `--input: 240 10% 10%`

Isso reduz a diferença relativa com o fundo (de 3.5x para 2.5x), tornando as bordas muito mais discretas.

**2. Adicionar proteção contra regressão**

Adicionar um bloco de comentário explícito no topo do CSS (dentro de `:root`) marcando os valores de borda como "LOCKED — DO NOT CHANGE":

```css
/* ⚠️ LOCKED VALUES — DO NOT MODIFY ⚠️
   Border and input colors are calibrated for CopyMonster's dark/light themes.
   Dark mode: 10% lightness (subtle on 3.9% background)
   Light mode: 85% lightness (subtle on 100% background)
   Changing these causes visible "white border" regression. */
--border: 240 10% 10%;
--input: 240 10% 10%;
```

E repetir o comentário na seção `.light`:
```css
/* ⚠️ LOCKED — see :root comment */
--border: 240 5.9% 85%;
--input: 240 5.9% 85%;
```

Isso garante que futuras edições no arquivo vejam o aviso e não sobrescrevam os valores.

### Arquivo afetado
- `src/index.css` — apenas 4 linhas de valor + comentários de proteção

### Zero alterações em: componentes, rotas, layout, lógica de negócio.

