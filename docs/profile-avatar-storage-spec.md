# 用户头像上传方案

## 1. 目标

本次只扩展个人资料模块的头像能力：

- 支持从个人页选择本地图片
- 上传到 Supabase Storage
- 上传成功后把最终头像地址写回 `public.profiles.avatar_url`
- 保持当前 `avatar_url` 外链输入能力可用

## 2. 范围

本次只包含：

- Storage bucket：`avatars`
- 个人资料接口：`/api/inner-data`
- 个人页脚本：`public/inner-pages/个人页面/code.html`
- 用户资料表字段：`public.profiles.avatar_url`

本次不包含：

- 图片裁剪
- 多尺寸缩略图
- CDN 图片处理
- 跨页面统一头像组件改造

## 3. 存储设计

### 3.1 Bucket

- bucket 名称：`avatars`
- 访问方式：`public`
- 文件大小限制：`2MB`
- MIME 类型限制：
  - `image/jpeg`
  - `image/png`
  - `image/webp`

### 3.2 对象路径

对象路径使用固定模式：

```text
<user_id>/avatar
```

说明：

- 每个用户只维护一个稳定头像路径
- 允许覆盖上传，避免生成大量历史头像垃圾文件
- 图片类型由上传时的 `contentType` 决定，不依赖文件扩展名

## 4. 权限策略

对 `storage.objects` 增加 `avatars` bucket 的策略：

- `SELECT`：认证用户可读取自己路径下的头像对象
- `INSERT`：认证用户可上传自己路径下的头像对象
- `UPDATE`：认证用户可覆盖自己路径下的头像对象
- `DELETE`：认证用户可删除自己路径下的头像对象

约束规则：

```sql
bucket_id = 'avatars'
and name like auth.uid()::text || '/%'
```

## 5. 接口流程

### 5.1 上传头像

`POST /api/inner-data`

请求类型：

```text
multipart/form-data
```

表单字段：

- `action=upload-avatar`
- `file=<image file>`

服务端行为：

1. 校验文件类型和大小
2. 上传到 `avatars/<user_id>/avatar`
3. 生成 public URL
4. 回写 `public.profiles.avatar_url`
5. 返回 `{ ok: true, avatarUrl }`

### 5.2 保存个人资料

上传成功后，个人页继续沿用原有 `update-profile` JSON 请求，把最终 `avatarUrl` 一并保存，保证前端行为一致。

## 6. 兼容规则

- 如果用户不上传文件，仍可手动填写 `avatarUrl`
- 如果用户既选了本地文件又填了 URL，保存时优先使用上传返回的 URL
- 旧账号已有 `avatar_url` 的，不需要迁移数据
