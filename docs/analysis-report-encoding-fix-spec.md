# Analysis Report Encoding Fix Spec

- Scope: analysis report static pages only.
- Goal: restore a readable Chinese UI after the report HTML files were written with corrupted text encoding.
- Rules:
  - Recover from the last known good Chinese version of the report page.
  - Reapply only the already-approved report changes: direct PDF download and detail-list rendering.
  - Do not rewrite unrelated report layout sections.
- Compatibility:
  - Keep the existing /api/inner-data?view=analysis-report payload contract unchanged.
  - Keep the alias page and the original Chinese page in sync.