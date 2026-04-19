# 系统支持页第一阶段记录

## 本轮目标
- 把侧边栏中的帮助中心与技术文档从旧静态 inner-pages 收口到真实 dashboard 路由
- 保留当前米色支持页的版式与文案层次
- 为后续低频静态页清理继续缩小范围

## 实施内容
1. 新增 `app/dashboard/help/page.tsx` 与 `app/dashboard/docs/page.tsx`
   - 两个页面都直接进入 dashboard 公共壳
   - 不再依赖 iframe 与静态 HTML 运行时
2. 新增 `components/dashboard/pages/support/support-page.tsx`
   - 抽出可复用的系统支持页模板
   - 复刻帮助中心与技术文档的英雄区、目录侧栏、内容分块与顶部切换入口
3. 更新 dashboard 公共壳映射
   - `DashboardLayout` 纳入 `/dashboard/help` 与 `/dashboard/docs`
   - `DashboardTopbar` 增加“系统支持 / 帮助中心”“系统支持 / 技术文档”标题映射
4. 更新 `DashboardSidebar`
   - 底部帮助中心与技术文档入口改为 `/dashboard/help` 与 `/dashboard/docs`
   - 保持原有米色底部链接视觉风格

## 结果
- 侧边栏底部的帮助中心与技术文档已脱离旧静态 inner-pages 运行时依赖
- dashboard 主干兼容层进一步缩小，但 `public/inner-pages/帮助中心` 与 `public/inner-pages/技术文档` 仍作为历史基线保留
- 后续可继续按同一模式收口系统设置、性能分析与知识库等低频入口
