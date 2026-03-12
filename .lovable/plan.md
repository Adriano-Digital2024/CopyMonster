

## Fix Chat Landing Page: Logo Size + Translation Keys

Two issues found:

### 1. Logo too small
- Currently `h-8` in ChatLanding.tsx (line 97)
- Navbar uses `h-14` -- will match that

### 2. Translations not loading
- The app uses **inline resources** in `src/i18n/config.ts` (3861 lines), NOT the JSON locale files
- `chatLanding` keys were added to JSON files but never added to `config.ts`
- Will add the `chatLanding` block to all 3 languages in `config.ts`:
  - **EN** before line 1284 (end of en.translation)
  - **PT** before line 2565 (end of pt.translation)
  - **ES** before line 3847 (end of es.translation)

### Files changed
- `src/pages/ChatLanding.tsx` -- logo `h-8` → `h-14`
- `src/i18n/config.ts` -- add `chatLanding` keys to en, pt, es sections

No other components affected.

