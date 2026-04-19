export const metrics = [
  {
    label: "日志总量",
    value: "24,981",
    change: "+18%",
    description: "覆盖 Web、数据库与系统运行日志，后续接入 Supabase 真实统计。",
    tone: "info" as const,
  },
  {
    label: "异常日志数量",
    value: "312",
    change: "+47",
    description: "规则检测与模型识别的异常总数，当前为静态演示数据。",
    tone: "warning" as const,
  },
  {
    label: "高风险事件",
    value: "27",
    change: "Priority",
    description: "需要优先处理的核心异常，后面会接入风险等级评估结果。",
    tone: "warning" as const,
  },
  {
    label: "模型置信均值",
    value: "0.81",
    change: "Stable",
    description: "低于阈值时会进入 Uncertain Case，支持人工复核。",
    tone: "success" as const,
  },
];

export const modes = [
  {
    name: "Rule Only",
    description: "仅根据关键词和规则模板进行异常匹配，速度快但语义理解有限。",
    active: false,
  },
  {
    name: "Model Only",
    description: "全部日志直接进入大模型分析，覆盖广但成本和耗时更高。",
    active: false,
  },
  {
    name: "Hybrid",
    description: "先规则筛选异常，再结合 RAG 与大模型输出建议，作为默认推荐模式。",
    active: true,
  },
];

export const timelineSteps = [
  {
    title: "日志上传与解析",
    description: "接收用户上传的日志文件，识别编码、来源和字段结构。",
    status: "Ready",
    tone: "info" as const,
  },
  {
    title: "规则异常检测",
    description: "匹配 Error、Timeout、500、Connection refused 等异常特征。",
    status: "Ready",
    tone: "success" as const,
  },
  {
    title: "RAG 知识检索",
    description: "关联知识库中的常见故障案例，为模型提供运维上下文。",
    status: "Pending",
    tone: "neutral" as const,
  },
  {
    title: "大模型语义分析",
    description: "输出异常原因、风险等级、修复建议和结构化置信度。",
    status: "Pending",
    tone: "neutral" as const,
  },
  {
    title: "不确定性控制",
    description: "低置信度或输出异常时标记为待人工复核的 Uncertain Case。",
    status: "Pending",
    tone: "warning" as const,
  },
  {
    title: "结果入库与展示",
    description: "将日志记录、分析结果和模式指标写入数据库并反映到仪表盘。",
    status: "Ready",
    tone: "info" as const,
  },
];

export const integrationPoints = [
  {
    title: "日志上传接口",
    description: "接收文件、创建分析任务并返回任务编号。",
    endpoint: "POST /api/logs/upload",
  },
  {
    title: "分析任务接口",
    description: "根据分析模式触发规则引擎、RAG 和模型工作流。",
    endpoint: "POST /api/analyze",
  },
  {
    title: "结果查询接口",
    description: "拉取统计指标、异常列表和修复建议列表。",
    endpoint: "GET /api/dashboard",
  },
  {
    title: "人工复核接口",
    description: "记录备注、复核结论和是否确认修复。",
    endpoint: "PATCH /api/incidents/:id",
  },
];

export const typeBreakdown = [
  { label: "Timeout", value: 94, percent: 86 },
  { label: "Connection Refused", value: 71, percent: 64 },
  { label: "HTTP 500", value: 63, percent: 57 },
  { label: "Permission Denied", value: 48, percent: 43 },
  { label: "Database Exception", value: 36, percent: 32 },
];

export const riskBreakdown = [
  { label: "High", value: 27, color: "#b45151" },
  { label: "Medium", value: 108, color: "#9a7a2d" },
  { label: "Low", value: 144, color: "#2f6a9a" },
  { label: "Uncertain", value: 33, color: "#4e7faa" },
];

export const modeComparisons = [
  {
    mode: "Rule Only",
    detections: 173,
    latency: "0.8s",
    calls: 0,
  },
  {
    mode: "Model Only",
    detections: 296,
    latency: "7.2s",
    calls: 4892,
  },
  {
    mode: "Hybrid",
    detections: 312,
    latency: "2.4s",
    calls: 312,
    highlight: true,
  },
];

export const logIncidents = [
  {
    id: "INC-1021",
    message: 'GET /api/orders -> upstream timed out after 30001ms while reading response header',
    source: "nginx · web-prod-03 · 21:14",
    cause: "上游订单服务响应超时，疑似数据库连接池饱和。",
    risk: "高风险",
    tone: "danger" as const,
    confidence: "0.91",
  },
  {
    id: "INC-1022",
    message: 'psql: FATAL: remaining connection slots are reserved for superuser connections',
    source: "postgres · db-prod-01 · 21:16",
    cause: "数据库连接数耗尽，应用层未及时释放空闲连接。",
    risk: "高风险",
    tone: "danger" as const,
    confidence: "0.88",
  },
  {
    id: "INC-1023",
    message: 'java.net.ConnectException: Connection refused: billing-service:8080',
    source: "java-app · billing-worker · 21:18",
    cause: "计费服务实例不可达，可能由容器重启或服务发现异常引起。",
    risk: "中风险",
    tone: "warning" as const,
    confidence: "0.79",
  },
  {
    id: "INC-1024",
    message: '403 Forbidden for /internal/admin/audit from 10.0.2.15',
    source: "gateway · edge-02 · 21:19",
    cause: "内部权限策略命中，也可能是异常访问行为，需要复核。",
    risk: "待复核",
    tone: "info" as const,
    confidence: "0.54",
  },
];

export const repairSuggestions = [
  {
    title: "优先检查数据库连接池配置",
    detail:
      "建议核对连接池上限、空闲连接回收策略，并确认慢查询是否导致连接长期占用。",
    tag: "高优先级",
    tone: "danger" as const,
  },
  {
    title: "回溯上游服务的发布与重启记录",
    detail:
      "如果异常集中出现在某个时间窗口，优先对照发布记录和 Pod 重启事件定位变更点。",
    tag: "关联排查",
    tone: "warning" as const,
  },
  {
    title: "将低置信结果转入人工复核队列",
    detail:
      "对置信度低于 0.6 的分析结果增加备注入口和复核状态，减少模型误判风险。",
    tag: "Uncertain Case",
    tone: "info" as const,
  },
];
