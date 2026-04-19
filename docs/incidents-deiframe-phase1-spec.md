# 问题处理第一阶段迁移规范

## 背景
- `/dashboard/incidents` 当前仍通过 `StaticInnerPage` 加载 `public/inner-pages/问题中心/code.html`
- dashboard 公共壳已覆盖工作台、人工复核、分析记录、个人页面、历史日志存档，问题处理应继续按同样模式迁入 Next

## 目标
1. 将 `/dashboard/incidents` 改为真实 Next 页面
2. 保持当前“问题中心”米色视觉、筛选条、表格和右侧洞察区不变形
3. 继续复用现有问题列表、系统处理建议趋势和今日复核效率口径

## 范围
- `app/dashboard/incidents/page.tsx`
- `components/dashboard/shell/dashboard-layout.tsx`
- `components/dashboard/shell/dashboard-topbar.tsx`
- `lib/dashboard/incidents.ts`
- `components/dashboard/pages/incidents/*`

## 实施要求
1. 首屏数据由 `lib/dashboard/incidents.ts` 提供，字段口径与 `view=incidents` 保持一致
2. 第一阶段需要覆盖：
   - 页面标题区
   - 风险等级 / 问题类型 / 待复核 / 处理阶段 / 文件名搜索筛选区
   - 问题表格与分页
   - 系统处理建议趋势
   - 今日复核效率
3. “立即处理”与“详情”入口继续指向人工复核路由，不扩散到新的子页实现
4. 暂不迁移更细粒度的问题详情页

## 非目标
- 不修改 `/api/inner-data` 的 incidents 返回结构
- 不删除 `StaticInnerPage` 或 `public/inner-pages`
- 不进入规则层、模型层、RAG 层

## 验收标准
1. `/dashboard/incidents` 不再走 iframe
2. 视觉和层次接近原静态问题中心页
3. 筛选、分页和前往人工复核入口可用
4. `eslint` 通过
5. `npm run build` 通过
