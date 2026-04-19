# 项目当前状态

## 当前结论

项目已经完成第一版上线，当前部署形态为：
- 前端与服务端：Vercel
- 数据与存储：Supabase
- 向量检索：Supabase pgvector
- Embedding：阿里百炼 `text-embedding-v4`
- 分析模型：阿里百炼 `qwen-plus`
- 备用模型：阿里百炼 `qwen-flash`

当前系统已经具备可用的主链路能力：
- 用户登录、退出、重置密码
- 日志上传与存储
- 规则检测
- 知识库检索（RAG）
- 大模型分析
- 分析结果落库与后台查看

## 已完成能力

### 认证与页面
- 登录、注册、退出、重置密码可用
- Dashboard 主要页面可访问
- 认证相关文案已改为中文
- `tasks` 页面已修复 hydration 与乱码问题

### 规则与知识库
- 已完成多批规则导入
- 已完成多批知识库导入
- 知识库已完成 embedding 回填
- 已启用 `pgvector` 检索函数 `match_knowledge_base(...)`

### RAG 与分析链
- 已从纯关键词检索升级为 hybrid retrieval
- 已增加 source domain 对齐
- 已收紧 `generic_error` / `http_5xx` / `exception` 的召回策略
- 已限制模型只看异常附近日志上下文，降低串信息问题
- 已接入 `qwen-plus` 主模型和 `qwen-flash` 备用模型

### 性能优化
- 已实现短 / 中 / 长日志分流：
  - `rules_fast`
  - `hybrid`
  - `summarized_hybrid`
- 已实现 incident 聚合
- 已对长杂乱日志设置 LLM 分析上限
- 已把分析调度从串行改为有限并发

## 当前验收结论

### 已验证通过
- 空白日志不会误报，也不会把页面搞崩
- 连续单一故障日志分析质量基本可用
- 混杂日志主链路可跑通
- 大号杂乱日志性能已从 6 分钟级优化到 1 分钟级左右
- 异常栈中的 `at ...` 行不再被当成独立 incident
- `Method.java:566` 这类数字不再误判为 `http_5xx`

### 当前仍然存在的限制
- 大杂乱日志虽然已经明显提速，但仍不算“非常快”
- 长日志目前只是做了分流、聚合和限流，还没有做真正的摘要压缩
- 异常栈还没有做完整的“多行聚合成一个 incident”
- README 当前仍有旧乱码，后续建议单独清理

## 推荐的下一步

### 短期
- 继续观察线上真实日志的误报和漏报
- 按真实日志补规则和知识库
- 清理 README 乱码，补正式运行说明

### 中期
- 做异常栈聚合
- 做长日志摘要/关键信息抽取
- 做异步分析任务，而不是上传后同步等待

### 长期
- 如果日志量持续增大，迁移到 Linux 服务器
- 引入队列、任务调度和更完整的后台作业体系

## 上线形态建议

当前形态适合：
- 第一版上线
- 演示
- 小规模真实使用

如果后续出现以下情况，建议迁移 Linux：
- 日志量明显增加
- 上传后等待时间不可接受
- 需要后台异步任务或更强可控性

## 环境变量说明

生产环境至少需要：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_LOG_BUCKET`
- `LLM_PROVIDER`
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `LLM_FALLBACK_MODEL`
- `RAG_EMBEDDING_MODEL`
- `RAG_EMBEDDING_DIMENSIONS`

## 安全提醒

- `.env.local` 与任何包含真实密钥的本地环境文件都不能提交到 GitHub
- 用于导入 Vercel 的临时环境文件，导入完成后应删除
- 一旦密钥出现在聊天、截图或其他共享介质中，应及时轮换
