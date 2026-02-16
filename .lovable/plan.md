

## Estilizar Barras de Rolagem do Menu Lateral

### Problema
As barras de rolagem verticais nos menus laterais do Dashboard e do Admin usam o estilo nativo do navegador (cinza claro), quebrando a identidade visual do dark theme.

### Solucao
Adicionar estilos CSS customizados para as scrollbars usando pseudo-elementos `::-webkit-scrollbar`, aplicados via uma classe utilitaria reutilizavel.

### Alteracoes

| Arquivo | Acao |
|---------|------|
| `src/index.css` | Adicionar classe `.custom-scrollbar` com estilos para `::-webkit-scrollbar`, `::-webkit-scrollbar-track` e `::-webkit-scrollbar-thumb` usando as cores do design system (border, muted) |
| `src/components/layouts/DashboardLayout.tsx` | Adicionar classe `custom-scrollbar` ao `<nav>` (linha 99) |
| `src/components/layouts/AdminLayout.tsx` | Adicionar classe `custom-scrollbar` ao `<nav>` do Sidebar |

### Detalhes Tecnicos

Nova classe CSS em `src/index.css` dentro de `@layer components`:

```css
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--border));
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground));
}
```

Tambem sera adicionado suporte para Firefox via `scrollbar-width: thin` e `scrollbar-color`.

A barra ficara fina (6px), com cores que combinam com o dark theme, e transparente quando nao estiver em uso.

