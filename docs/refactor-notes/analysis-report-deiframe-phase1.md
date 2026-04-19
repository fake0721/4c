# 分析报告详情页第一阶段迁移记录

## 本轮目标
- 将 `/dashboard/analyses` 从 `StaticInnerPage + iframe` 切换为真实 Next 页面
- 保持当前分析报告详情页的头部、摘要卡片、分布区、根因与建议区、问题详情列表结构
- 复用现有 `analysis-report` 数据字段，不改返回契约

## 实施内容
1. 新增 `lib/dashboard/analysis-report.ts`
   - 直接复用当前 `view=analysis-report` 的查询口径
   - 输出日志信息、摘要、问题类型分布、风险分布、问题详情数据
2. 新增 `components/dashboard/pages/analysis-report/analysis-report-page.tsx`
   - 还原分析报告详情页的主要视觉区块
   - 保留导出 Word / PDF 与“提交复核”按钮的基础能力
3. 替换 `app/dashboard/analyses/page.tsx`
   - 去掉 `StaticInnerPage`
   - 改为根据 `logId` 直接渲染真实报告页面
4. 更新 dashboard 公共壳映射
   - `DashboardLayout` 纳入 `/dashboard/analyses`
   - `DashboardTopbar` 增加“工作台·分析报告 / 报告详情”标题

## 结果
- `/dashboard/analyses` 不再依赖 iframe
- 页面可以基于真实 `logId` 展示分析报告详情
- 分析报告详情页已纳入统一 dashboard 公共壳，后续可继续清理旧 iframe 兼容层
