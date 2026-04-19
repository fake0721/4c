# Analysis Report PDF Export

- Module: analysis report PDF export only.
- Replaced the blank-window print flow with direct browser-side PDF generation and download.
- Removed the unstable DOM-screenshot export path after repeated runtime failures in the browser.
- Reworked the export layout away from dashboard-style cards into a dedicated report document style.
- Uses a report header, metadata grid, section dividers, table-style distribution blocks, narrative paragraphs, and page footer instead of mirroring the live page.
- Tuned the first-page spacing rules so summary cards and narrative blocks no longer crowd each other on the cover page.
- Writes the final file through `Blob` download instead of a base64-heavy save path.
- Keeps the PDF content grouped around the same report sections: header, summary, distribution, insights, and detail cards.
- Keeps the existing report page structure and Word export flow unchanged.
- The PDF button now shows an in-progress state while the file is being generated.
- Verification: `npx eslint components/dashboard/pages/analysis-report/analysis-report-page.tsx` passed, `npm run build` passed.
