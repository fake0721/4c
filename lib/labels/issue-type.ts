const ISSUE_TYPE_LABEL_MAP: Record<string, string> = {
  EXCEPTION: "异常",
  GENERIC_ERROR: "通用错误",
  ERROR: "错误",
  TIMEOUT: "超时异常",
  DATABASE_TIMEOUT: "数据库超时",
  CONNECTION_TIMEOUT: "连接超时",
  CONNECTION_REFUSED: "连接被拒绝",
  CONNECTION_RESET: "连接重置",
  CONNECTION_POOL_EXHAUSTED: "连接池耗尽",
  CONNECTION_POOL_RECONFIG: "连接池配置异常",
  HTTP_5XX: "服务端错误（HTTP 5XX）",
  HTTP_4XX: "客户端错误（HTTP 4XX）",
  HTTP_403: "禁止访问（HTTP 403）",
  HTTP_404: "资源不存在（HTTP 404）",
  HTTP_429: "请求过载（HTTP 429）",
  DNS_ERROR: "DNS 解析失败",
  NETWORK_ERROR: "网络异常",
  NETWORK_DELAY: "网络延迟",
  DB_ERROR: "数据库异常",
  DATABASE_ERROR: "数据库异常",
  DEADLOCK: "死锁",
  AUTH_ERROR: "鉴权失败",
  UNAUTHORIZED: "未授权访问",
  FORBIDDEN: "权限不足",
  PERMISSION_DENIED: "权限不足",
  PERMISSION_ERROR: "权限异常",
  OUT_OF_MEMORY: "内存溢出",
  MEMORY_LEAK: "内存泄漏",
  SLOW_QUERY: "慢查询",
  HEARTBEAT_LOST: "心跳丢失",
  RATE_LIMIT: "触发限流",
  CPU_SPIKE: "CPU 异常升高",
  FATAL_ERROR: "严重错误",
  PANIC: "严重故障",
  SSL_HANDSHAKE_FAILED: "SSL 握手失败",
  CIRCUIT_BREAKER_OPEN: "熔断器已打开",
  REPLICATION_LAG: "复制延迟",
  DISK_FULL: "磁盘空间不足",
  TOO_MANY_CONNECTIONS: "连接数过多",
  OPEN_FILE_LIMIT: "文件句柄达到上限",
  SERVICE_ERROR: "服务异常",
  CONFIGURATION_ERROR: "配置异常",
  RESOURCE_EXHAUSTION: "资源不足异常",
  UNKNOWN_ERROR: "未知异常",
};

export function normalizeIssueTypeKey(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/[\s/\-]+/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function toIssueTypeDisplayName(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "未知异常";
  }

  if (/[\u4e00-\u9fa5]/.test(raw)) {
    return raw;
  }

  const key = normalizeIssueTypeKey(raw);
  if (ISSUE_TYPE_LABEL_MAP[key]) {
    return ISSUE_TYPE_LABEL_MAP[key];
  }

  const lower = key.toLowerCase();
  if (lower.includes("database") && lower.includes("timeout")) return "数据库超时";
  if (lower.includes("connect") && lower.includes("timeout")) return "连接超时";
  if (lower.includes("connection") && lower.includes("pool")) return "连接池异常";
  if (lower.includes("network") && lower.includes("delay")) return "网络延迟";
  if (lower.includes("network")) return "网络异常";
  if (lower.includes("dns")) return "DNS 解析失败";
  if (lower.includes("ssl") && lower.includes("handshake")) return "SSL 握手失败";
  if (lower.includes("permission") || lower.includes("forbidden")) return "权限异常";
  if (lower.includes("auth") || lower.includes("unauthorized")) return "鉴权失败";
  if (lower.includes("rate") && lower.includes("limit")) return "触发限流";
  if (lower.includes("memory") && lower.includes("leak")) return "内存泄漏";
  if (lower.includes("out") && lower.includes("memory")) return "内存溢出";
  if (lower.includes("deadlock")) return "死锁";
  if (lower.includes("resource") || lower.includes("disk") || lower.includes("cpu") || lower.includes("thread")) {
    return "资源不足异常";
  }
  if (lower.includes("config") || lower.includes("property") || lower.includes("yaml")) {
    return "配置异常";
  }
  if (lower.includes("service") || lower.includes("server")) return "服务异常";
  if (lower.includes("database") || lower.includes("db")) return "数据库异常";
  if (lower.includes("exception")) return "异常";
  if (lower.includes("timeout")) return "超时异常";
  if (lower.includes("error")) return "错误";

  return raw;
}
