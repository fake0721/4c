# Issue Type Display Spec

- Scope: issue type display only.
- Storage rule: keep raw `error_type` values unchanged in the database.
- Output rule: every UI-facing issue type must pass through a shared display-label formatter.
- Priority:
  1. Use explicit Chinese mapping when a known type is matched.
  2. Use keyword-based Chinese fallback for common new variants.
  3. If no safe Chinese label can be inferred, keep the original English text.
- Compatibility rule: do not remove existing raw fields; only normalize displayed labels.
- Affected surfaces:
  - dashboard and report statistics
  - analysis detail pages
  - review and history issue labels
