# 导入整理说明

## 规则库

### 直接可导入
- `sigma-import-ready-rules.json`
- 这份已经按当前系统可用的来源收敛成：`nginx`、`system`、`application`
- 可以作为第一批导入到 `detection_rules`

### 先暂缓
- `sigma-deferred-network-rules.json`
- 这批是网络设备日志规则
- 当前系统上传来源还没有 `network`
- 现在导入也不会命中，建议后面支持网络设备来源后再导

### 为什么不是全部原样导入
当前规则引擎只会精确匹配上传来源：
- `nginx`
- `system`
- `postgres`
- `application`
- `custom`

所以原始 Sigma 里很多更细的来源标签，例如：
- `windows`
- `linux`
- `spring`
- `django`
- `mssql`
- `network`

在当前系统里不会直接生效，需要先映射到现有来源。

## 知识库

### 直接可导入
- `knowledge-base-starter.json`
- 这份是第一批种子知识库，一共 23 条
- 已按当前知识库导入器可识别的字段整理：
  - `title`
  - `category`
  - `keywords`
  - `symptom`
  - `possibleCause`
  - `solution`
  - `source`

### 当前内容范围
- `nginx`
- `postgres`
- `system`
- `application`

### 当前建议
1. 先导入 `sigma-import-ready-rules.json`
2. 再导入 `knowledge-base-starter.json`
3. 上传日志时按实际情况选择：
   - Nginx 日志 -> `nginx`
   - 系统/服务日志 -> `system`
   - 应用/框架日志 -> `application`
4. 等后面扩展更多上传来源和知识来源，再补第二批规则和知识
