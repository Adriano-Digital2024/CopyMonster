

## Change Default Language to English

The i18n configuration currently sets Portuguese (`pt`) as the default language. This needs to be changed to English (`en`) in the config files.

### Changes

**`src/i18n/config.ts`** — Change `lng: 'pt'` to `lng: 'en'`

**`src/i18n/config-new.ts`** — Same change: `lng: 'pt'` → `lng: 'en'`

This ensures all users see the app in English by default, while still being able to switch to PT or ES via the language switcher.

