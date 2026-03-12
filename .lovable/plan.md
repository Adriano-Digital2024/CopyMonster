

## AI Chat Landing Page at `/chat`

A high-conversion, Kimi-inspired landing page that acts as CopyMonster's AI entry point. Visitors see a minimal chat interface, type a prompt, and get redirected to `/auth` on send.

### New Files

**`src/pages/ChatLanding.tsx`**
- Minimal full-page layout (no DashboardLayout)
- Header: logo (left), language switcher + theme toggle (right)
- Centered content with headline, subheadline, chat input, trust microcopy, and category tags
- Typing animation cycling through example prompts in the placeholder
- On send: redirect to `/auth`
- All text wrapped in `t()` for i18n

**Layout structure:**
```text
┌─────────────────────────────────────────┐
│ [Logo]                  [Lang] [Theme]  │
│                                         │
│                                         │
│   Create High-Converting Copy in        │
│   Seconds with AI                       │
│   (subheadline below)                   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Ask CopyMonster to write...   ➤ │    │
│  └─────────────────────────────────┘    │
│                                         │
│  "Used by digital creators..."          │
│                                         │
│  [Sales Pages] [Ad Copy] [Instagram]    │
│  [Launch Scripts] [Email Sequences]     │
│                                         │
└─────────────────────────────────────────┘
```

### Route Change

**`src/App.tsx`** — Add public route:
```tsx
import ChatLanding from "./pages/ChatLanding";
// ...
<Route path="/chat" element={<ChatLanding />} />
```

### i18n Keys

Add `chatLanding.*` keys to all 3 locale files (`en`, `pt`, `es`) covering:
- `headline`, `subheadline`, `placeholder`, `trustText`
- Tag labels: `salesPages`, `adCopy`, `instagramContent`, `launchScripts`, `emailSequences`

### Key Features
- **Typing animation**: `useEffect` interval cycling through 3-4 example prompts as animated placeholder text
- **Glow effect**: Chat input uses `glow-effect` class + subtle border gradient matching CopyMonster primary gold
- **Send action**: Navigates to `/auth` via `useNavigate`
- **Responsive**: Works on mobile with stacked layout
- **Lightweight**: No heavy dependencies, uses existing components (Button, ThemeToggle, LanguageSwitcher)

