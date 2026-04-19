# 兼容层清理第一阶段记录

## 本轮目标
- 删除已经退出运行时链路的 `StaticInnerPage` 组件实现
- 保留仍由低频静态入口使用的 `public/inner-pages`
- 为后续统一清理 iframe 兼容层缩小遗留范围

## 实施内容
1. 复查 `StaticInnerPage` 的运行时引用
   - 确认 `app/dashboard/*` 与 `components/dashboard/*` 中已无页面继续使用该组件
   - 仅剩组件文件本体作为历史兼容残留
2. 删除 `components/dashboard/static-inner-page.tsx`
   - 去掉旧 iframe 包裹实现
   - 同时移除其中的头像同步补丁逻辑
3. 保留 `public/inner-pages`
   - 帮助中心、技术文档、历史问题库、探索根因知识库、性能分析、系统设置等低频静态入口仍有直接链接
   - 本轮不对这些低频入口做删除或重定向调整

## 结果
- dashboard 主干运行时代码已不再保留 `StaticInnerPage` 兼容组件
- `public/inner-pages` 作为低频静态入口与历史参照基线继续保留
- 后续可以在低频页逐步迁完后，再进入 `public/inner-pages` 的第二阶段清理
