# Analysis Report Detail List Spec

- Scope: analysis report detail list only.
- Goal: make the 问题详情列表 section render the actual detailRows items so users can see other issues and their suggestions, without adding a duplicate suggestion module.
- Rules:
  - Keep 核心分析结论 as the primary-issue summary block.
  - Use 问题详情列表 for per-item issue rendering.
  - Reuse existing detailRows fields: incidentId, 	ype, iskLabel, confidence, cause, suggestion, snippet, lineNumber.
  - Preserve existing page layout direction and avoid a large visual rewrite.
- Compatibility:
  - Do not change the analysis-report API schema.
  - Keep the current report summary and export behavior intact.
  - Limit this refactor to the analysis report UI module only.