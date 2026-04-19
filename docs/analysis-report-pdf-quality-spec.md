# Analysis Report PDF Quality Spec

- Scope: analysis report PDF export only.
- Goal: keep direct PDF download and make the exported file read like a formal report instead of a copied dashboard page.
- Rules:
  - Do not restore browser print flow.
  - Reuse the current analysis-report data contract and keep the fix limited to the export module.
  - Prefer browser-native `canvas + jsPDF + Blob download` over DOM screenshot or print-window flows.
  - Avoid base64-heavy export steps when writing the final PDF file.
  - Use a dedicated PDF document layout: report header, metadata block, section dividers, narrative blocks, tables, and page footer.
  - The PDF home page must prioritize readable spacing over dashboard density; summary cards and opening paragraphs must not overlap or clip.
  - Keep the exported PDF readable and structurally aligned with the current report page sections.
- Keep the existing analysis-report payload contract unchanged.
- Compatibility:
  - Keep Word export behavior unchanged.
  - Keep the current report layout semantics: summary, distribution, root cause, suggestion, detail cards.
  - Do not change the live page UI just to serve PDF styling.
  - Limit this fix to the analysis report export module only.
