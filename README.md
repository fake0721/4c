# 智能日志分析与运维辅助决策系统

基于 `Next.js + Supabase + Vercel` 的智能日志分析系统原型。

## 当前能力

- Supabase 注册登录
- 仪表盘路由保护
- 用户 `profiles` 资料读取
- 日志上传并写入 `logs` 表
- 原始日志写入 Supabase Storage
- 第一层规则检测写入 `log_errors`
- 前端仪表盘原型页面

## 后续 SQL

- 第一阶段业务表：在 Supabase SQL Editor 执行基础建表 SQL
- 第二阶段规则与人工复核：执行 [phase-2-rules-and-review.sql](./supabase/phase-2-rules-and-review.sql)
- 第三阶段权限加固：执行 [phase-9-rls-hardening.sql](./supabase/phase-9-rls-hardening.sql)
- 第三阶段权限加固验证：执行 [phase-9-rls-verify.sql](./supabase/phase-9-rls-verify.sql)

## 本地启动

```bash
npm install
npm run dev
```

默认访问 `http://localhost:3000`。

## 接入大模型

本项目已内置 OpenAI 兼容协议接入层，按以下步骤即可启用真实模型推理：

1. 在 `.env.local` 配置以下变量（服务端使用，不要提交到仓库）

```bash
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://你的模型网关地址/v1
LLM_API_KEY=你的密钥
LLM_MODEL=主模型名
LLM_FALLBACK_MODEL=备用模型名

# RAG 向量化（推荐与推理模型同网关）
RAG_EMBEDDING_MODEL=向量模型名
RAG_EMBEDDING_DIMENSIONS=1536
```

2. 重启开发服务

```bash
npm run dev
```

3. 打开上传页确认“模型状态：已就绪”

- 已就绪：可选择 `Model Only` / `Hybrid`，可执行三模式对比。
- 未就绪：页面会自动限制为 `Rule Only`，并提示缺失项。

4. 上传日志后验证生效

- 在分析结果中确认 `analysis_mode` 为 `model_only` 或 `hybrid`。
- 在 `analysis_results` 表中确认 `model_name`、`tokens_used`、`latency_ms` 已写入。

## 常见问题

- 报错“当前分析模式依赖大模型”：
	说明 `LLM_PROVIDER` 或 `LLM_BASE_URL/LLM_API_KEY/LLM_MODEL` 未完整配置。
- 只想本地联调流程，不调用真实模型：
	可设为 `LLM_PROVIDER=mock`。

## 阿里云百炼专用配置

如果你使用阿里云百炼（DashScope OpenAI 兼容模式），可直接使用下列参数：

LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=你的百炼API Key
LLM_MODEL=qwen-plus
LLM_FALLBACK_MODEL=qwen-flash

说明：
- 若使用海外节点，可将 BASE_URL 改为对应地域地址。
- 本项目的 Embedding 会校验向量维度，`RAG_EMBEDDING_MODEL` 与 `RAG_EMBEDDING_DIMENSIONS` 需要成对填写并保持一致。
- 若暂时不启用向量召回，可先只配置上面的 5 个变量跑通 Model Only 与 Hybrid 基础流程。
