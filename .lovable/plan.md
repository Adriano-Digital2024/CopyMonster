

## Atualizar Imagem de Preview Social (Open Graph)

### O que será feito

Substituir a imagem de preview social (Open Graph / Twitter Card) que aparece quando o link do site é compartilhado em redes sociais.

### Alterações

| Arquivo | Ação |
|---------|------|
| `public/og-image.jpg` | Copiar a imagem enviada para a pasta `public/` |
| `index.html` | Atualizar as meta tags `og:image` e `twitter:image` de `https://lovable.dev/opengraph-image-p98pqg.png` para `/og-image.jpg` (URL relativa ao domínio do projeto) |

### Detalhes Técnicos

As meta tags atuais apontam para uma imagem genérica do Lovable. Serão atualizadas para usar a nova imagem do CopyMonster:

- `<meta property="og:image">` -> URL completa da imagem no domínio do projeto
- `<meta name="twitter:image">` -> mesma URL

A imagem será salva na pasta `public/` pois meta tags no `index.html` referenciam arquivos estáticos diretamente (não passam pelo bundler do Vite).

