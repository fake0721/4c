# 用户资料模块字段规范

## 1. 目标

本次只处理 `public.profiles` 这一个模块，不新建第二张用户资料表。

目标：
- 保持现有登录链路与 `profiles.id -> auth.users.id` 关系不变
- 保持现有字段兼容，避免影响注册、工作台头部和个人页
- 让个人页字段语义和数据库字段语义对齐

## 2. 现状

当前 `public.profiles` 已存在以下字段：
- `id uuid`
- `email text`
- `display_name text`
- `team_name text`
- `role text`
- `created_at timestamptz`
- `updated_at timestamptz`

当前问题：
- 个人页把“用户名”映射到 `display_name`
- 个人页把“个人简介”错误映射到 `team_name`
- 接口代码已经尝试读取 `avatar_url`，但数据库还没有该字段
- `team_name` 仍被注册页和工作台头部当作“团队名”使用，不能直接改语义

## 3. 目标字段

继续使用 `public.profiles` 作为用户资料主表，并扩展以下字段：

| 数据库字段 | 类型 | 用途 |
| --- | --- | --- |
| `id` | `uuid` | 用户 ID，对应 `auth.users.id` |
| `email` | `text` | 邮箱 |
| `username` | `text` | 用户名，供个人页编辑 |
| `display_name` | `text` | 展示名，兼容旧逻辑 |
| `avatar_url` | `text` | 头像 URL |
| `bio` | `text` | 个人简介 |
| `team_name` | `text` | 团队名，继续保留给注册和工作台 |
| `role` | `text` | 角色 |
| `created_at` | `timestamptz` | 创建时间 |
| `updated_at` | `timestamptz` | 更新时间 |

## 4. 前后端映射

TypeScript 接口统一使用 `camelCase`：

```ts
type AccountProfile = {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  teamName: string;
  createdAt?: string;
  updatedAt?: string;
};
```

字段映射：

| 前端字段 | 数据库字段 |
| --- | --- |
| `userId` | `id` |
| `email` | `email` |
| `username` | `username` |
| `displayName` | `display_name` |
| `avatarUrl` | `avatar_url` |
| `bio` | `bio` |
| `teamName` | `team_name` |

## 5. 兼容规则

- 不删除 `display_name`
- 不删除 `team_name`
- 个人页“用户名”改为读写 `username`
- 个人页“个人简介”改为读写 `bio`
- 工作台头部继续读 `team_name`
- 注册流程继续写 `team_name`
- `ensureProfileForUser(...)` 不再把缺失的 metadata 强行覆盖成 `null`

## 6. 数据库变更策略

只做增量扩展：

```sql
alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists bio text;
```

可选回填：

```sql
update public.profiles
set username = coalesce(username, display_name)
where username is null and display_name is not null;
```

索引策略：

```sql
create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;
```

## 7. 本次范围

本次只包含：
- `public.profiles` 字段扩展
- 账户资料接口读写修正
- 个人页字段绑定修正

本次不包含：
- 独立头像文件上传系统
- 新的用户中心表
- 跨模块替换 `display_name` / `team_name`
