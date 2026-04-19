import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

export type RuleRow = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  pattern: string;
  matchType: string;
  flags: string | null;
  errorType: string | null;
  riskLabel: string;
  riskLevel: string | null;
  sourceTypes: string[];
  enabled: boolean;
  source: "rule" | "knowledge";
  readOnly?: boolean;
  relatedKnowledge: {
    id: string;
    title: string;
  }[];
  updatedAt: string;
  summary: string;
};

export type RulesPageData = {
  stats: {
    total: number;
    enabled: number;
    paused: number;
    warnings: number;
  };
  rows: RuleRow[];
  knowledgeOptions: {
    id: string;
    title: string;
    summary: string;
    category: string;
  }[];
};

const EMPTY_RULES_DATA: RulesPageData = {
  stats: {
    total: 0,
    enabled: 0,
    paused: 0,
    warnings: 0,
  },
  rows: [],
  knowledgeOptions: [],
};

function getDisabledKnowledgeIdsFromMetadata(metadata: unknown) {
  const record = (metadata ?? {}) as Record<string, unknown>;
  const raw = Array.isArray(record.disabledKnowledgeIds) ? record.disabledKnowledgeIds : [];
  return new Set(raw.map((item) => String(item ?? "").trim()).filter(Boolean));
}

function asIsoDate(value: string | null | undefined) {
  return value ?? new Date(0).toISOString();
}

function toRiskLabel(value: string | null | undefined) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  if (value === "low") return "低风险";
  return "未知";
}

function toRuleDisplayName(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "未命名规则";
  if (/[\u4e00-\u9fa5]/.test(raw)) return raw;

  const normalized = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const nameMap: Record<string, string> = {
    "nginx upstream prematurely closed": "Nginx 上游连接提前关闭",
    "system service failed to start": "系统服务启动失败",
    "nginx ssl handshake failed": "Nginx SSL 握手失败",
    "system too many open files": "系统文件句柄耗尽",
    "application circuit breaker open": "应用熔断器已开启",
    "postgres replication lag warning": "Postgres 主从复制延迟告警",
    "critical system overflow": "关键系统溢出告警",
    "user login anomaly detection": "用户登录异常检测",
    "legacy api deprecated watch": "旧版接口调用监测",
    "application retry exhausted": "应用重试耗尽",
    "kubernetes pod pending insufficient resources": "Kubernetes Pod 资源不足（Pending）",
  };

  return nameMap[normalized] ?? `规则：${raw}`;
}

function toRuleDescription(pattern: string | null | undefined, errorType: string | null | undefined, name: string | null | undefined) {
  const explicitName = String(name ?? "").trim();
  const rawPattern = String(pattern ?? "").trim();
  const issueName = toIssueTypeDisplayName(errorType);
  const merged = `${explicitName.toLowerCase()} ${rawPattern.toLowerCase()}`;

  if (/[\u4e00-\u9fa5]/.test(rawPattern)) {
    return rawPattern;
  }

  if (merged.includes("timeout") || merged.includes("timed out")) {
    return "用于检测请求或连接超时类异常，并触发超时告警。";
  }
  if (merged.includes("ssl") || merged.includes("handshake")) {
    return "用于检测 SSL 握手失败与证书链路异常问题。";
  }
  if (merged.includes("circuit") || merged.includes("fallback")) {
    return "用于识别熔断器打开、降级触发等系统保护状态。";
  }
  if (merged.includes("replication") || merged.includes("lag")) {
    return "用于检测主从复制延迟和同步冲突风险。";
  }
  if (merged.includes("open files") || merged.includes("too many")) {
    return "用于检测文件句柄耗尽与系统资源上限触发问题。";
  }
  if (issueName && issueName !== "未知异常") {
    return `用于检测${issueName}相关异常模式。`;
  }
  if (explicitName.length > 0) {
    return `用于检测规则「${explicitName}」对应的异常触发条件。`;
  }

  return "用于检测系统日志中的异常模式并触发告警。";
}

async function selectKnowledgeRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const withErrorType = await supabase
    .from("knowledge_base")
    .select("id, title, symptom, category, error_type, updated_at")
    .order("id", { ascending: false })
    .limit(1000);

  if (!withErrorType.error && withErrorType.data) {
    return withErrorType.data.map((item) => ({
      id: String(item.id),
      title: String(item.title ?? "未命名知识条目").trim() || "未命名知识条目",
      summary: String(item.symptom ?? "").trim(),
      category: String(item.category ?? "general").trim() || "general",
      errorType: String((item as { error_type?: string | null }).error_type ?? "").trim(),
        updatedAt: String((item as { updated_at?: string | null }).updated_at ?? "").trim(),
    }));
  }

  const fallback = await supabase
    .from("knowledge_base")
    .select("id, title, symptom, category")
    .order("id", { ascending: false })
    .limit(1000);

  return (fallback.data ?? []).map((item) => ({
    id: String(item.id),
    title: String(item.title ?? "未命名知识条目").trim() || "未命名知识条目",
    summary: String(item.symptom ?? "").trim(),
    category: String(item.category ?? "general").trim() || "general",
    errorType: "",
    updatedAt: "",
  }));
}

export async function getRulesPageData(): Promise<RulesPageData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_RULES_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_RULES_DATA;
  }

  const disabledKnowledgeIds = getDisabledKnowledgeIdsFromMetadata(user.user_metadata);

  const { data, error } = await supabase
    .from("detection_rules")
    .select("id, name, description, pattern, match_type, flags, error_type, risk_level, source_types, enabled, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  const knowledgeRows = await selectKnowledgeRows(supabase);

  if (error || !data) {
    return EMPTY_RULES_DATA;
  }

  const knowledgeByErrorType = new Map<string, Array<{ id: string; title: string }>>();
  for (const item of knowledgeRows) {
    const key = item.errorType.toLowerCase();
    if (!key) continue;
    const current = knowledgeByErrorType.get(key) ?? [];
    if (current.length < 3) {
      current.push({ id: item.id, title: item.title });
    }
    knowledgeByErrorType.set(key, current);
  }

  const ruleRows = data.map((row) => {
    const displayName = toRuleDisplayName(row.name);
    const description = String(row.description ?? "").trim() || toRuleDescription(row.pattern, row.error_type, row.name);
    const relatedKnowledge = knowledgeByErrorType.get(String(row.error_type ?? "").toLowerCase()) ?? [];

    return {
      id: row.id,
      name: row.name ?? "",
      displayName,
      description,
      pattern: row.pattern ?? "",
      matchType: row.match_type ?? "semantic",
      flags: row.flags ?? null,
      errorType: row.error_type ?? null,
      riskLabel: toRiskLabel(row.risk_level),
      riskLevel: row.risk_level ?? null,
      sourceTypes: Array.isArray(row.source_types) ? row.source_types.filter((item): item is string => typeof item === "string") : [],
      enabled: Boolean(row.enabled),
      source: "rule" as const,
      relatedKnowledge,
      updatedAt: row.updated_at ? asIsoDate(row.updated_at) : "",
      summary: description,
    } satisfies RuleRow;
  });

  const knowledgeRuleRows = knowledgeRows.map((item) => ({
    id: `knowledge:${item.id}`,
    name: item.title,
    displayName: item.title,
    description: item.summary || "知识库条目",
    pattern: item.summary || item.title,
    matchType: "knowledge",
    flags: null,
    errorType: item.errorType || "unknown_error",
    riskLabel: "中风险",
    riskLevel: "medium",
    sourceTypes: [],
    enabled: !disabledKnowledgeIds.has(item.id),
    source: "knowledge" as const,
    readOnly: true,
    relatedKnowledge: [{ id: item.id, title: item.title }],
    updatedAt: item.updatedAt || "",
    summary: item.summary || `知识库条目：${item.title}`,
  } satisfies RuleRow));

  const rows = [...ruleRows, ...knowledgeRuleRows];

  return {
    stats: {
      total: rows.length,
      enabled: rows.filter((row) => row.enabled).length,
      paused: rows.filter((row) => !row.enabled).length,
      warnings: rows.filter((row) => row.riskLevel === "high" && row.enabled).length,
    },
    rows,
    knowledgeOptions: (knowledgeRows ?? []).map((item) => ({
      id: String(item.id),
      title: String(item.title ?? "未命名知识条目").trim() || "未命名知识条目",
      summary: String(item.summary ?? "").trim(),
      category: String(item.category ?? "general").trim() || "general",
    })),
  };
}
