# 历史漏报库运营摘要 Refactor Notes

## 本轮目标

补齐漏报库的可见性，让“自动沉淀”和“历史回补”不再是隐藏在代码里的能力。

## 本轮新增

- [docs/historical-missed-cases-ops-summary-spec.md](/c:/智能日志分析系统/next-app/docs/historical-missed-cases-ops-summary-spec.md)

## 解决的问题

1. 漏报库虽然已有链路，但当前增长状态不可见
2. 已完成复核中哪些可以回补，当前没有摘要视图
3. 需要为后续 UI 或运营面板预留稳定接口

## 结果

现在漏报库将具备独立运营摘要能力：

- 能看复核进度
- 能看回补资格
- 能看当前漏报沉淀结果
