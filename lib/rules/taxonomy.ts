import type { MatchType, RiskLevel, RuleCategory, StandardErrorType } from "@/lib/rules/types";

const STANDARD_ERROR_TYPE_SET = new Set<StandardErrorType>([
  "database_error",
  "network_error",
  "permission_error",
  "service_error",
  "configuration_error",
  "resource_exhaustion",
  "timeout",
  "unknown_error",
]);

const RULE_CATEGORY_SET = new Set<RuleCategory>([
  "detection",
  "extraction",
  "aggregation",
  "weak_signal",
]);

const MATCH_TYPE_SET = new Set<MatchType>(["keyword", "regex", "threshold", "repeat"]);
const RISK_LEVEL_SET = new Set<RiskLevel>(["low", "medium", "high"]);

const DIRECT_ERROR_TYPE_ALIASES: Record<string, StandardErrorType> = {
  "数据库异常": "database_error",
  database_error: "database_error",
  db_error: "database_error",
  "网络异常": "network_error",
  network_error: "network_error",
  "权限异常": "permission_error",
  permission_error: "permission_error",
  "服务异常": "service_error",
  service_error: "service_error",
  "配置异常": "configuration_error",
  configuration_error: "configuration_error",
  config_error: "configuration_error",
  "资源不足异常": "resource_exhaustion",
  resource_exhaustion: "resource_exhaustion",
  resource_error: "resource_exhaustion",
  "超时异常": "timeout",
  timeout: "timeout",
  "未知异常": "unknown_error",
  unknown_error: "unknown_error",
  generic_error: "unknown_error",
};

function normalizeKey(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .replace(/[\s/-]+/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function normalizeTagValue(value: string) {
  const raw = value.trim();
  if (!raw) {
    return "";
  }

  if (/[\u4e00-\u9fa5]/.test(raw)) {
    return raw;
  }

  return normalizeKey(raw);
}

function dedupeTags(values: string[]) {
  return Array.from(new Set(values.map((item) => normalizeTagValue(item)).filter(Boolean)));
}

export function normalizeRuleCategory(value: string | null | undefined): RuleCategory {
  const normalized = normalizeKey(value);
  return RULE_CATEGORY_SET.has(normalized as RuleCategory)
    ? (normalized as RuleCategory)
    : "detection";
}

export function normalizeMatchType(value: string | null | undefined): MatchType {
  const normalized = normalizeKey(value);
  return MATCH_TYPE_SET.has(normalized as MatchType) ? (normalized as MatchType) : "keyword";
}

export function normalizeRiskLevel(value: string | null | undefined): RiskLevel {
  const normalized = normalizeKey(value);

  if (normalized === "高" || normalized === "严重" || normalized === "critical") {
    return "high";
  }

  if (normalized === "低" || normalized === "info") {
    return "low";
  }

  if (normalized === "中" || normalized === "moderate") {
    return "medium";
  }

  return RISK_LEVEL_SET.has(normalized as RiskLevel) ? (normalized as RiskLevel) : "medium";
}

function inferErrorType(normalized: string): StandardErrorType {
  if (DIRECT_ERROR_TYPE_ALIASES[normalized]) {
    return DIRECT_ERROR_TYPE_ALIASES[normalized];
  }

  if (normalized.includes("timeout")) {
    return "timeout";
  }

  if (
    normalized.includes("permission") ||
    normalized.includes("forbidden") ||
    normalized.includes("unauthorized") ||
    normalized.includes("auth")
  ) {
    return "permission_error";
  }

  if (
    normalized.includes("database") ||
    normalized.includes("db") ||
    normalized.includes("sql") ||
    normalized.includes("deadlock") ||
    normalized.includes("transaction")
  ) {
    return "database_error";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("dns") ||
    normalized.includes("host") ||
    normalized.includes("route") ||
    normalized.includes("connection") ||
    normalized.includes("socket") ||
    normalized.includes("ssl")
  ) {
    return "network_error";
  }

  if (
    normalized.includes("config") ||
    normalized.includes("property") ||
    normalized.includes("yaml") ||
    normalized.includes("package_signing") ||
    normalized.includes("environment")
  ) {
    return "configuration_error";
  }

  if (
    normalized.includes("memory") ||
    normalized.includes("disk") ||
    normalized.includes("cpu") ||
    normalized.includes("thread") ||
    normalized.includes("resource") ||
    normalized.includes("quota") ||
    normalized.includes("open_file") ||
    normalized.includes("oom")
  ) {
    return "resource_exhaustion";
  }

  if (
    normalized.includes("service") ||
    normalized.includes("server") ||
    normalized.includes("runtime") ||
    normalized.includes("framework") ||
    normalized.includes("template") ||
    normalized.includes("process") ||
    normalized.includes("plugin") ||
    normalized.includes("component") ||
    normalized.includes("fatal") ||
    normalized.includes("panic") ||
    normalized.includes("crash") ||
    normalized.includes("termination") ||
    normalized.includes("update")
  ) {
    return "service_error";
  }

  if (normalized.includes("exception") || normalized.includes("unknown") || normalized.includes("generic")) {
    return "unknown_error";
  }

  return "unknown_error";
}

export function normalizeErrorType(
  value: string | null | undefined,
  existingTags: string[] = [],
): { errorType: StandardErrorType; subTags: string[] } {
  const raw = String(value ?? "").trim();
  const normalized = normalizeKey(raw);

  if (!raw) {
    return {
      errorType: "unknown_error",
      subTags: dedupeTags(existingTags),
    };
  }

  const errorType = STANDARD_ERROR_TYPE_SET.has(normalized as StandardErrorType)
    ? (normalized as StandardErrorType)
    : inferErrorType(normalized);

  const shouldKeepOriginalTag =
    normalized.length > 0 &&
    normalized !== errorType &&
    !Object.prototype.hasOwnProperty.call(DIRECT_ERROR_TYPE_ALIASES, normalized);

  return {
    errorType,
    subTags: dedupeTags(shouldKeepOriginalTag ? [...existingTags, normalized] : existingTags),
  };
}
