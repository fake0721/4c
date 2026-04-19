# 规则库模板对齐 Refactor Notes

## 本轮目标

本轮只处理 Rule Agent，目标是让当前规则库可以对齐你给出的规则库模板和异常分类表，同时保持现有检测链路可继续工作。

本轮遵守以下边界：

- 不重写 RAG 检索逻辑
- 不重写模型分析链路
- 不大改规则管理页 UI
- 优先复用现有 `detection_rules`、默认规则和导入链路

## 对照结论

改造前，当前规则库并不是完全按模板组织：

1. 字段层面缺少 `rule_category / sub_tags / source / scenario / example_log / notes / template_rule_id`
2. `error_type` 仍以细粒度英文编码为主，没有统一收敛到 8 大类
3. 导入器只能稳定吃当前简化 JSON 结构，不能直接对齐模板字段
4. 规则引擎只支持 `keyword / regex`，还不能直接执行 `threshold / repeat`

## 实际修改文件

- [docs/rule-library-template-alignment-spec.md](/c:/智能日志分析系统/next-app/docs/rule-library-template-alignment-spec.md)
- [lib/rules/types.ts](/c:/智能日志分析系统/next-app/lib/rules/types.ts)
- [lib/rules/taxonomy.ts](/c:/智能日志分析系统/next-app/lib/rules/taxonomy.ts)
- [lib/rules/default-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/default-rules.ts)
- [lib/rules/engine.ts](/c:/智能日志分析系统/next-app/lib/rules/engine.ts)
- [lib/rules/db-rules.ts](/c:/智能日志分析系统/next-app/lib/rules/db-rules.ts)
- [lib/imports/types.ts](/c:/智能日志分析系统/next-app/lib/imports/types.ts)
- [lib/imports/normalize.ts](/c:/智能日志分析系统/next-app/lib/imports/normalize.ts)
- [app/imports/actions.ts](/c:/智能日志分析系统/next-app/app/imports/actions.ts)
- [app/rules/actions.ts](/c:/智能日志分析系统/next-app/app/rules/actions.ts)
- [lib/labels/issue-type.ts](/c:/智能日志分析系统/next-app/lib/labels/issue-type.ts)
- [supabase/phase-3-rule-library-template-alignment.sql](/c:/智能日志分析系统/next-app/supabase/phase-3-rule-library-template-alignment.sql)
- [docs/refactor-notes/rule-library-template-alignment.md](/c:/智能日志分析系统/next-app/docs/refactor-notes/rule-library-template-alignment.md)

## 这次怎么做的

### 1. 规则结构扩展，但不破坏老字段

保留以下现有主链路字段：

- `id`
- `name`
- `pattern`
- `match_type`
- `error_type`
- `risk_level`
- `source_types`
- `enabled`

新增模板对齐字段：

- `template_rule_id`
- `rule_category`
- `sub_tags`
- `source`
- `scenario`
- `example_log`
- `notes`

### 2. 异常类型归一到 8 大类

新增规则分类归一逻辑，把输入的中文分类、旧细粒度编码、已有历史值统一映射到以下主类型：

- `database_error`
- `network_error`
- `permission_error`
- `service_error`
- `configuration_error`
- `resource_exhaustion`
- `timeout`
- `unknown_error`

同时把旧细粒度信息沉到 `sub_tags`，避免语义丢失。

### 3. 导入器直接兼容模板字段

导入器现在除了兼容旧 JSON，也可以直接识别这些模板键：

- `rule_id`
- `rule_name`
- `rule_category`
- `pattern_or_condition`
- `error_type`
- `sub_tags`
- `severity`
- `source`
- `scenario`
- `example_log`
- `notes`

并支持：

- 中文高/中/低风险等级
- JSON 数组形式的 `sub_tags`
- `threshold / repeat` 作为规则存储类型

### 4. 默认规则同步收口

内置默认规则已调整到这套分类口径：

- 主异常类型只保留 8 大类
- 原细粒度语义通过 `subTags` 保留
- 不改变原有基础匹配意图

### 5. 兼容未迁移数据库的回退路径

为了避免代码先部署、数据库还没迁移时直接报错：

- 动态规则读取先尝试扩展字段查询，失败后回退到旧字段查询
- 新建规则、导入规则先尝试写扩展字段，失败后回退到旧字段写入

## 本轮仍未处理的部分

- `threshold / repeat` 规则目前只支持入库，不会被当前逐行规则引擎执行
- RAG 仍未按 8 大类做专门检索调优
- 模型层仍未利用 `sub_tags / scenario / example_log`
- 规则管理页表单还没有把全部模板字段暴露出来

## 影响评估

### 已解决

- 规则库字段结构可以对齐模板
- 规则导入口径可以对齐模板
- 主异常分类口径统一到 8 大类
- 默认规则和数据库规则读取口径开始统一

### 风险与边界

- 若直接把旧数据库中已存在的细粒度 `error_type` 批量改写成 8 大类，可能影响既有统计口径；本轮没有做历史数据重刷
- `threshold / repeat` 只是结构就位，不代表运行态已经具备完整时序规则能力

## 后续建议顺序

1. 先执行数据库迁移脚本，确保扩展字段真实落库
2. 再补一个模板示例 JSON 文件，把 20 条示例规则变成可直接导入的数据
3. 然后进入 RAG 层，把 8 大类接成检索路由条件
4. 最后再处理 UI，把新字段完整展示出来
