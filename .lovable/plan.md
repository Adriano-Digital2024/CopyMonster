
## Renderizar Markdown nas respostas dos agentes

### Problema
Linha 588 de `ChatInterface.tsx` renderiza o conteudo como texto puro:
```
<p className="text-sm whitespace-pre-wrap">{message.content}</p>
```
Isso faz com que `**negrito**`, `*italico*`, listas e titulos aparecam como caracteres literais.

### Solucao

**1. Instalar `react-markdown`** como dependencia do projeto.

**2. Modificar `src/components/chat/ChatInterface.tsx`:**
- Importar `ReactMarkdown` de `react-markdown`
- Substituir a linha 588 de:
  ```
  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
  ```
  por:
  ```
  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
    <ReactMarkdown>{message.content}</ReactMarkdown>
  </div>
  ```
  Nota: usa `<div>` em vez de `<p>` porque ReactMarkdown gera elementos de bloco (`<p>`, `<ul>`, `<h1>`, etc.) que nao podem ficar dentro de `<p>`.

**3. Adicionar estilos em `src/index.css`** para ajustar a tipografia do markdown dentro do chat:
- Remover margens excessivas dos paragrafos dentro do bubble
- Ajustar tamanho de titulos para ficarem proporcionais ao chat
- Garantir que listas tenham indentacao adequada

### Detalhes tecnicos

- `prose prose-sm dark:prose-invert` sao classes do Tailwind Typography (ja incluido via Tailwind) que aplicam estilos automaticos para conteudo HTML gerado por markdown
- `max-w-none` remove o limite de largura padrao do prose
- Apenas mensagens do assistente se beneficiam do markdown, mas aplicar em ambas nao causa problemas (mensagens do usuario raramente contem markdown)
- Nenhuma alteracao de rota, layout, i18n ou banco de dados

### Arquivos modificados
| Arquivo | Alteracao |
|---------|-----------|
| `package.json` | Adicionar `react-markdown` |
| `src/components/chat/ChatInterface.tsx` | Import + trocar `<p>` por `<ReactMarkdown>` |
| `src/index.css` | Estilos opcionais para prose dentro do chat |
