
## Add "Coming Soon" Badges to Intelligence Section Menu Items

Add a discreet, small badge labeled "Em breve" with highlight/primary color to three menu items in the DashboardLayout sidebar.

### Changes

**`src/components/layouts/DashboardLayout.tsx`**

1. Add `comingSoon` property to the three intelligence menu items (lines 86-88):
   - `adsIntelligence`
   - `performanceOverview`  
   - `marketRadar`

2. Update the menu item rendering (lines 106-121) to display a small "Em breve" badge when `comingSoon: true`:
   - Badge styling: `text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-auto`
   - Keep the existing "Start" badge logic for the positioning item

### Visual Result
- Three intelligence menu items will show a small, discreet "Em breve" badge in primary color
- Badge appears at the right end of each button, similar to the existing "Start" badge pattern
- No other menu items affected
