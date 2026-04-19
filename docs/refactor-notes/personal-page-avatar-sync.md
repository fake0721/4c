# 个人页面右上角头像同步修复记录

## 问题

- 个人页面保存头像后，中间的大头像会更新。
- 右上角导航栏中的小头像仍停留在旧图片，造成“头像没有改成功”的错觉。

## 处理

- 给右上角小头像增加独立标识 `topAvatarPreview`。
- 抽出统一头像刷新函数，同时更新：
  - 页面主头像预览
  - 右上角导航小头像
- 读取资料和保存资料后都使用 `updatedAt` 拼接版本参数，减少浏览器缓存导致的不刷新。

## 结果

- 输入头像 URL 时，大头像和右上角小头像会一起变化。
- 保存资料成功后，右上角小头像会立即同步。

## 验证

- 文本检索确认以下关键点已接入：
  - `topAvatarPreview`
  - `resolveAvatarSrc(...)`
  - `updateAvatarViews(...)`
  - 保存资料后消费 `profilePayload.avatarUrl` 与 `profilePayload.updatedAt`
