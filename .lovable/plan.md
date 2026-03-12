

## Add "Em breve" Badge to Meta Ads & Instagram Title

### Change

**`src/pages/dashboard/Settings.tsx`** (line 425)

Add a small "Em breve" badge right next to the "Meta Ads & Instagram" title text, using the same styling pattern already used in the sidebar menu (`text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded`).

```tsx
// Before
<h4 className="font-semibold">{t('dashboard.settings.integrations.meta.title')}</h4>

// After
<h4 className="font-semibold flex items-center gap-2">
  {t('dashboard.settings.integrations.meta.title')}
  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Em breve</span>
</h4>
```

Single line change, no other modifications needed.

