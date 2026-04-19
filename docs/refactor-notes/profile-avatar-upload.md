# 用户头像上传改造说明

## 变更目标

本次在不重写个人资料模块的前提下，为个人页补上“本地头像上传到 Supabase Storage 并持久保存”的能力。

## 本次改动

- 新增 `avatars` Storage bucket 方案
- 为 `storage.objects` 增加用户只能操作自己头像路径的策略
- `/api/inner-data` 新增 `upload-avatar` multipart action
- 头像上传后立即回写 `public.profiles.avatar_url`
- 个人页保存时，如果选了本地文件，会先上传再保存资料

## 存储策略

- bucket：`avatars`
- 路径：`<user_id>/avatar`
- 访问：public URL
- 限制：JPG/PNG/WEBP，最大 2MB

## 兼容结论

- 不上传文件时，外链 `avatarUrl` 依旧可用
- 上传文件时，会覆盖该用户已有头像对象，不产生历史垃圾文件
- `profiles.avatar_url` 仍是个人页头像真源字段

## 已知边界

- 当前不做裁剪和压缩
- 当前不生成多尺寸缩略图
- 当前页面上的“本地预览”仍保留，最终持久化以保存时上传结果为准