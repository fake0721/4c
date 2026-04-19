# Workbench Loading State Spec

- Scope: only `public/inner-pages/???/code.html`.
- Goal: remove first-paint fake dashboard values without changing layout.
- Default summary values become `--`.
- Default summary helper text becomes loading copy.
- Trend arrays start at zero.
- Type breakdown percentages start at `0%`.
- Recent analysis and todo cards start as loading placeholders.
- Dashboard fetch uses `cache: "no-store"`.

- Loading copy must be replaced with synced status after dashboard hydration.
