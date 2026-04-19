# Issue Type Display Alignment

- Module: issue type display layer only.
- Added shared formatter at `lib/labels/issue-type.ts`.
- Kept raw `error_type` storage unchanged for compatibility.
- Unified dashboard/report API output through the shared formatter.
- Unified React review/detail components through the shared formatter.
- Replaced remaining static report placeholders with Chinese issue labels.
- Build verification: `npm run build` passed.
