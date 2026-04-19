# 系统设置第一阶段记录

## 本轮目标
- 将系统设置从旧静态 inner-page 收口到真实 dashboard 路由
- 保持当前系统管理页的米色视觉层次与主要表单交互
- 收口规则页里仍指向旧系统设置页的入口

## 实施内容
1. 新增 `lib/dashboard/settings.ts`
   - 复用当前 settings 字段口径与模板签名链接逻辑
   - 输出系统设置、导出模板列表与当前激活模板
2. 新增 `components/dashboard/pages/settings/settings-page.tsx`
   - 还原系统设置页的主要版块：模型配置、全局参数、导出模板管理、保存动作
   - 继续调用 `update-system-settings`、`update-export-templates` 与 `upload-export-template-file`
3. 新增 `app/dashboard/settings/page.tsx`
   - 将 `/dashboard/settings` 切换为真实 Next 页面
4. 更新公共壳和入口
   - `DashboardLayout` 纳入 `/dashboard/settings`
   - `DashboardTopbar` 增加“工作台·系统管理 / 系统设置”标题映射
   - `DashboardSidebar` 将系统管理高亮扩展到系统设置页
   - `RulesPage` 中的“系统设置”入口改到 `/dashboard/settings`

## 结果
- `/dashboard/settings` 不再依赖旧静态页运行时
- 规则页进入系统设置的主入口已完成收口
- 性能分析暂时继续保留为低频静态入口，后续可按同一模式迁移

