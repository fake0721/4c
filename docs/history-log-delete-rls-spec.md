# 历史日志删除权限修正规范

## 背景
- 历史日志存档页的前端删除按钮和 API 已经接通。
- 但 `logs` 表当前只有 `SELECT / INSERT / UPDATE` 的 RLS 策略，没有 `DELETE` 策略。
- 结果是已登录用户在 UI 中发起删除时，请求会命中数据库权限限制，表现为“日志删除未生效，请刷新后重试”。

## 目标
1. 为 `public.logs` 补齐最小必要的 `DELETE` RLS 策略。
2. 只允许已登录用户删除自己的日志。
3. 不改字段结构，不重写删除接口。

## 范围
- Supabase migration
- 历史日志删除链路说明文档

## 实施要求
1. 新增 `logs_delete_own` 策略。
2. 策略条件必须与现有 `logs_select_own` / `logs_update_own` 一致，使用 `auth.uid() = user_id`。
3. 不放宽到跨用户删除。

## 验收标准
1. `pg_policies` 中能查到 `public.logs` 的 `DELETE` 策略。
2. 已登录用户可删除自己的日志。
3. 删除后刷新历史日志存档页，已删除记录不会再次出现。
