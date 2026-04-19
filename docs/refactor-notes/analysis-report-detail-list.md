# Analysis Report Detail List

- Module: analysis report detail list only.
- Clarified the page structure so 核心分析结论 remains the top-priority root-cause summary, while 问题详情列表 now renders each matched issue sample with its own cause and repair suggestion.
- Added a dedicated detail-list container and client-side rendering for detailRows on the static analysis report pages.
- Each detail item now shows type, risk label, confidence, line number, cause, suggestion, and log snippet when available.
- Build verification: 
pm run build passed.