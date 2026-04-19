# 规则库模板对齐规范

## 背景

当前系统的规则库已经具备基础检测能力，但与《规则库模板与 20 条示例规则》和《异常分类表》相比，仍有两个明显差异：

1. 规则字段偏精简，只覆盖 `name / pattern / match_type / error_type / risk_level / source_types / enabled`
2. `error_type` 仍以细粒度英文编码为主，没有统一收敛到 8 个主异常类型

本轮目标不是重写规则系统，而是在保持字段兼容的前提下，对齐模板结构，并为后续 RAG / 模型 / UI 统一口径打基础。

## 目标

1. 规则库支持模板中的扩展字段
2. 规则库 `error_type` 统一归一到推荐的 8 大类
3. 细粒度语义沉淀到 `sub_tags`
4. 兼容现有默认规则、动态规则、导入逻辑和现有调用方
5. 不在本轮重写 RAG、模型层和前端规则管理页

## 最终推荐的 8 大类

系统内统一使用以下英文编码作为规则层主异常类型：

| 中文名称 | 系统编码 |
| --- | --- |
| 数据库异常 | `database_error` |
| 网络异常 | `network_error` |
| 权限异常 | `permission_error` |
| 服务异常 | `service_error` |
| 配置异常 | `configuration_error` |
| 资源不足异常 | `resource_exhaustion` |
| 超时异常 | `timeout` |
| 未知异常 | `unknown_error` |

说明：

- 规则层只保留一个主异常类型
- 复合语义、细粒度类型、来源提示统一放入 `sub_tags`
- 现有细粒度编码如 `connection_refused`、`http_5xx`、`fatal_error`，导入时会被映射到主异常类型并保留为标签

## 模板字段与现有系统映射

| 模板字段 | 本轮落地方式 | 说明 |
| --- | --- | --- |
| `rule_id` | `template_rule_id` | 不替换现有主键 `id`，避免破坏数据库和调用方 |
| `rule_name` | `name` | 直接映射 |
| `rule_category` | `rule_category` | 新增可选字段，支持 `detection / extraction / aggregation / weak_signal` |
| `match_type` | `match_type` | 扩展支持 `keyword / regex / threshold / repeat` |
| `pattern_or_condition` | `pattern` | 继续复用现有字段 |
| `error_type` | `error_type` | 统一归一为 8 大类编码 |
| `sub_tags` | `sub_tags` | 新增可选字段，保存细粒度标签 |
| `severity` | `risk_level` | 支持高/中/低与 low/medium/high 双向兼容 |
| `source` | `source` | 新增可选字段，记录规则依据来源 |
| `scenario` | `scenario` | 新增可选字段 |
| `example_log` | `example_log` | 新增可选字段 |
| `enabled` | `enabled` | 直接映射 |
| `notes` | `notes` | 新增可选字段 |

## 兼容策略

### 1. 数据库主键不变

- `detection_rules.id` 继续作为内部主键
- 模板中的 `rule_id` 单独存入 `template_rule_id`
- 这样不会影响已有的规则编辑、启停、删除和引用逻辑

### 2. 检测引擎外包裹式兼容

- `keyword` / `regex` 规则继续由当前逐行规则引擎执行
- `threshold` / `repeat` 规则允许入库和导入，但当前引擎不直接执行
- `aggregation` / `weak_signal` 规则本轮先完成结构对齐，不强行重写运行时逻辑

### 3. 字段兼容

- 现有 `DetectionRule` 与 `DetectedIncident` 保持可用
- 新字段全部作为可选扩展字段接入
- 老数据没有扩展字段时，不影响读取和匹配

### 4. 错误类型兼容

- 导入器允许输入中文异常类型、英文细粒度编码或已有旧值
- 系统保存时统一归一为 8 大类
- 若导入值本身是细粒度编码，则自动补入 `sub_tags`

## 规则导入策略

规则导入器需要同时支持两类输入：

1. 当前系统已有 JSON 结构
2. 模板推荐字段结构

重点兼容键：

- `rule_id`
- `rule_name`
- `rule_category`
- `match_type`
- `pattern_or_condition`
- `error_type`
- `sub_tags`
- `severity`
- `source`
- `scenario`
- `example_log`
- `enabled`
- `notes`

## 默认规则调整原则

内置默认规则同步调整到这套分类口径：

1. 主异常类型只使用 8 大类编码
2. 原细粒度语义放到 `sub_tags`
3. 不改变已有基础匹配意图
4. 不大幅增加默认规则数量

示例：

- `connection_refused` -> `network_error`，并补 `sub_tags=["connection_refused"]`
- `http_5xx` -> `service_error`，并补 `sub_tags=["http_5xx","server_error"]`
- `permission_denied` -> `permission_error`
- `fatal_error` -> `service_error`，并补 `sub_tags=["fatal"]`

## 本轮范围

- `lib/rules/*`
- `lib/imports/*`
- `app/imports/actions.ts`
- `app/rules/actions.ts`
- `supabase/*.sql`
- `docs/*.md`

## 非目标

- 不重写 RAG 检索逻辑
- 不重写模型提示词和分析流程
- 不大改规则管理页 UI
- 不把所有历史规则数据一次性重刷

## 验收标准

1. 模板字段可以被系统导入和保存
2. 新规则的 `error_type` 会统一收敛到 8 大类
3. 细粒度语义会保存在 `sub_tags`
4. 默认规则已切换到统一分类口径
5. 现有关键调用链仍能通过类型检查和构建
