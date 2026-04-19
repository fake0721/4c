# Workbench Loading State Note

- Module: workbench only.
- Removed first-paint fake numbers and fake list items.
- Preserved existing layout and hydration flow.
- Added `cache: "no-store"` to dashboard data fetch.

- Fixed summary helper text so it switches from loading copy to synced status after real data arrives.

- Fixed summary card selector escaping so the four overview cards can hydrate after the dashboard API response.
