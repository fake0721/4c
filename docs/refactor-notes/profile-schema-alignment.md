# 用户资料模块重构说明

## 变更目的

本次只处理 `public.profiles` 模块，目标是把个人页字段和数据库字段语义对齐，同时保持现有注册、登录和工作台流程兼容。

## 本次改动

- 为 `public.profiles` 新增 `username`、`avatar_url`、`bio`
- 保留旧字段 `display_name`、`team_name`
- 个人页“用户名”改为读写 `username`
- 个人页“个人简介”改为读写 `bio`
- 个人页新增 `avatar_url` 输入与预览联动
- `ensureProfileForUser(...)` 改为增量同步 metadata，避免把缺失值覆盖成 `null`

## 兼容结论

- `team_name` 继续服务注册页和工作台头部
- `display_name` 继续保留，当前个人页会同步成与 `username` 一致
- 旧账号数据会自动回填 `username = display_name`

## 风险说明

- 头像目前走 URL 存储，不包含独立上传桶与图片裁剪
- 用户名唯一性由数据库索引保证，如出现重复会由 Supabase 返回约束错误