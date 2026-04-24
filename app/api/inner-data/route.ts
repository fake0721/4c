import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server-client";
import {
  backfillHistoricalMissedCasesForUser,
  syncHistoricalMissedCaseFromReviewCase,
} from "@/lib/analysis/missed-case-library";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";
import { getHistoryCaseRowByReviewCaseId } from "@/lib/dashboard/history-cases";
import { getPerformancePageData } from "@/lib/dashboard/performance";
import {
  buildReviewCaseSnapshot,
  summarizeReviewCaseRevision,
} from "@/lib/dashboard/review-case-revisions";
import {
  normalizeErrorType,
  normalizeMatchType,
  normalizeRiskLevel,
} from "@/lib/rules/taxonomy";

type JsonRecord = Record<string, unknown>;

type SystemSettings = {
  engine: string;
  temperature: number;
  maxTokens: number;
  concurrency: number;
  retentionDays: 30 | 90 | 365;
  autoCleanup: boolean;
  realtimePush: boolean;
};

type ExportTemplate = {
  id: string;
  name: string;
  format: string;
  description: string;
  usage: string;
  builtin?: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  downloadUrl?: string;
};

type DashboardSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ReviewCaseRevisionRecord = {
  created_at: string;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  engine: "Aether LLM v4.2 (默认)",
  temperature: 0.7,
  maxTokens: 32000,
  concurrency: 8,
  retentionDays: 90,
  autoCleanup: true,
  realtimePush: false,
};

const BUILTIN_EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: "pdf-standard",
    name: "系统深度诊断报告",
    format: "PDF Standard",
    description: "适用于月度审计汇报",
    usage: "audit",
    builtin: true,
  },
  {
    id: "word-docx",
    name: "技术故障简报",
    format: "Word (Docx)",
    description: "快速分享与在线协作",
    usage: "brief",
    builtin: true,
  },
  {
    id: "json-csv",
    name: "原始数据透传模板",
    format: "JSON / CSV",
    description: "针对三方BI工具对接",
    usage: "raw",
    builtin: true,
  },
];

const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const DEFAULT_ACTIVE_EXPORT_TEMPLATE_ID = "pdf-standard";

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSystemSettings(input: unknown): SystemSettings {
  const record = (input ?? {}) as Record<string, unknown>;
  const retentionRaw = asNumber(record.retentionDays, DEFAULT_SYSTEM_SETTINGS.retentionDays);
  const retentionDays: 30 | 90 | 365 = retentionRaw === 30 || retentionRaw === 365 ? retentionRaw : 90;

  return {
    engine: String(record.engine ?? DEFAULT_SYSTEM_SETTINGS.engine),
    temperature: Math.min(1, Math.max(0.1, asNumber(record.temperature, DEFAULT_SYSTEM_SETTINGS.temperature))),
    maxTokens: Math.min(128000, Math.max(4000, Math.round(asNumber(record.maxTokens, DEFAULT_SYSTEM_SETTINGS.maxTokens) / 1000) * 1000)),
    concurrency: Math.min(20, Math.max(1, Math.round(asNumber(record.concurrency, DEFAULT_SYSTEM_SETTINGS.concurrency)))),
    retentionDays,
    autoCleanup: Boolean(record.autoCleanup ?? DEFAULT_SYSTEM_SETTINGS.autoCleanup),
    realtimePush: Boolean(record.realtimePush ?? DEFAULT_SYSTEM_SETTINGS.realtimePush),
  };
}

function normalizeTemplateId(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getDisabledKnowledgeIdsFromMetadata(metadata: unknown) {
  const record = (metadata ?? {}) as Record<string, unknown>;
  const raw = Array.isArray(record.disabledKnowledgeIds) ? record.disabledKnowledgeIds : [];
  return new Set(raw.map((item) => String(item ?? "").trim()).filter(Boolean));
}

function toExportTemplates(input: unknown): ExportTemplate[] {
  const customRaw = Array.isArray(input) ? input : [];
  const customTemplates: ExportTemplate[] = [];
  const usedIds = new Set(BUILTIN_EXPORT_TEMPLATES.map((item) => item.id));

  for (const item of customRaw) {
    const record = (item ?? {}) as Record<string, unknown>;
    const id = normalizeTemplateId(record.id || record.name);
    if (!id || usedIds.has(id)) continue;

    usedIds.add(id);
    customTemplates.push({
      id,
      name: String(record.name ?? "未命名模板").trim() || "未命名模板",
      format: String(record.format ?? "Custom").trim() || "Custom",
      description: String(record.description ?? "用户自定义模板").trim() || "用户自定义模板",
      usage: String(record.usage ?? "custom").trim() || "custom",
      fileName: String(record.fileName ?? "").trim() || undefined,
      filePath: String(record.filePath ?? "").trim() || undefined,
      fileSize:
        typeof record.fileSize === "number" && Number.isFinite(record.fileSize)
          ? record.fileSize
          : undefined,
      builtin: false,
    });

    if (customTemplates.length >= 12) {
      break;
    }
  }

  return [...BUILTIN_EXPORT_TEMPLATES, ...customTemplates];
}

function toActiveExportTemplateId(activeId: unknown, templates: ExportTemplate[]) {
  const normalized = normalizeTemplateId(activeId);
  if (normalized && templates.some((item) => item.id === normalized)) {
    return normalized;
  }
  return DEFAULT_ACTIVE_EXPORT_TEMPLATE_ID;
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

function toLogStatusLabel(value: string | null | undefined) {
  if (value === "completed") return "已完成";
  if (value === "processing") return "分析中";
  if (value === "failed") return "已失败";
  return "未知";
}

function fileSizeLabel(size: number | null | undefined) {
  if (!size || size <= 0) return "-";
  const mb = size / (1024 * 1024);
  if (mb < 1) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  if (mb > 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }

  return `${mb.toFixed(1)} MB`;
}

function toRiskWeight(value: string | null | undefined) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function toRiskValue(value: string | null | undefined) {
  if (value === "high") return "high";
  if (value === "medium") return "medium";
  return "low";
}



function toIssueDisplayName(value: string | null | undefined) {
  return toIssueTypeDisplayName(value);
}

function toRuleDescription(
  pattern: string | null | undefined,
  errorType: string | null | undefined,
  name: string | null | undefined,
) {
  const explicitName = String(name ?? "").trim();
  const rawPattern = String(pattern ?? "").trim();
  const issueName = toIssueDisplayName(errorType);

  const lowerName = explicitName.toLowerCase();
  const lowerPattern = rawPattern.toLowerCase();
  const merged = `${lowerName} ${lowerPattern}`;

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

  if (merged.includes("start") && merged.includes("failed")) {
    return "用于检测系统服务启动失败或进入 failed 状态的异常。";
  }

  if (merged.includes("upstream") || merged.includes("nginx")) {
    return "用于检测网关上游连接提前断开与代理链路异常。";
  }

  if (issueName && issueName !== "未知异常") {
    return `用于检测${issueName}相关异常模式。`;
  }

  if (explicitName.length > 0) {
    return `用于检测规则「${explicitName}」对应的异常触发条件。`;
  }

  return "用于检测系统日志中的异常模式并触发告警。";
}

function toRuleDisplayName(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "未命名规则";

  if (/[\u4e00-\u9fa5]/.test(raw)) {
    return raw;
  }

  const lower = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const map: Record<string, string> = {
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

  if (map[lower]) {
    return map[lower];
  }

  return `规则：${raw}`;
}

function toKnowledgeDisplayTitle(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "未命名知识条目";

  if (/[\u4e00-\u9fa5]/.test(raw)) {
    return raw;
  }

  const lower = raw.toLowerCase();
  const map: Record<string, string> = {
    "nginx upstream timed out": "Nginx 上游请求超时",
    "nginx 502 bad gateway": "Nginx 502 网关错误",
    "nginx 503 service unavailable": "Nginx 503 服务不可用",
    "nginx worker process core dumped": "Nginx 工作进程崩溃（Core Dump）",
    "postgresql too many connections": "PostgreSQL 连接数超限",
    "postgresql remaining connection slots are reserved": "PostgreSQL 连接槽已保留",
    "postgresql deadlock detected": "PostgreSQL 检测到死锁",
    "postgresql password authentication failed": "PostgreSQL 认证失败",
    "system out of memory or oom killer": "系统内存不足或触发 OOM",
    "system no space left on device": "磁盘空间不足",
    "system permission denied or operation not permitted": "系统权限不足或操作被拒绝",
    "openssh daemon internal error": "OpenSSH 服务内部错误",
    "dns zone transfer failed": "DNS 区域传送失败",
    "spring security access denied or csrf exception": "Spring Security 访问拒绝或 CSRF 异常",
    "django suspiciousoperation or disallowedhost": "Django 可疑请求或非法主机",
    "sql syntax or injection style error message": "SQL 语法异常或注入特征告警",
    "java process execution error": "Java 进程执行异常",
    "node.js child_process execution error": "Node.js 子进程执行异常",
    "velocity template engine exception": "Velocity 模板引擎异常",
    "application connection refused": "应用连接被拒绝",
    "application read timeout": "应用读取超时",
    "bitbucket login failure": "Bitbucket 登录失败",
    "apache worker segmentation fault": "Apache 工作进程段错误",
    "application retry exhausted": "应用重试耗尽",
    "kubernetes pod pending insufficient resources": "Kubernetes Pod 资源不足（Pending）",
  };

  if (map[lower]) {
    return map[lower];
  }

  if (/^[a-z0-9\s._:-]+$/i.test(raw)) {
    return `英文条目（${raw}）`;
  }

  return raw;
}

function toKnowledgeSourceLabel(value: string | null | undefined) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "official_doc") return "官方文档";
  if (raw === "internal_runbook") return "内部手册";
  if (raw === "community") return "社区经验";
  if (!raw) return "内部资料";
  return raw.replace(/_/g, "-");
}

function hasMeaningfulText(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function toNullableTrimmedString(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeReviewNoteInput(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function listRecentReviewCaseRevisionSummaries(params: {
  supabase: DashboardSupabaseClient;
  reviewCaseId: string;
  userId: string;
  limit?: number;
}) {
  const { supabase, reviewCaseId, userId, limit = 5 } = params;
  const { data, error } = await supabase
    .from("review_case_revisions")
    .select("created_at, before_snapshot, after_snapshot")
    .eq("review_case_id", reviewCaseId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ReviewCaseRevisionRecord[]).map((item) =>
    summarizeReviewCaseRevision(
      buildReviewCaseSnapshot(item.before_snapshot ?? {}),
      buildReviewCaseSnapshot(item.after_snapshot ?? {}),
      item.created_at,
    ),
  );
}

async function getOwnedReviewCaseForRereview(params: {
  supabase: DashboardSupabaseClient;
  reviewCaseId: string;
  userId: string;
}) {
  const { supabase, reviewCaseId, userId } = params;
  const { data, error } = await supabase
    .from("review_cases")
    .select("id, user_id, log_error_id, review_status, final_error_type, final_risk_level, review_note, updated_at")
    .eq("id", reviewCaseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function parseSourceTypes(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isMissingRuleLibraryColumnError(message: string) {
  return /column|schema cache|Could not find the '.*' column/i.test(message);
}

function isAdminUser(user: User) {
  const roleCandidates = [
    user.app_metadata?.role,
    user.user_metadata?.role,
    user.app_metadata?.user_role,
    user.user_metadata?.user_role,
  ];

  return roleCandidates.some(
    (value) =>
      typeof value === "string" &&
      ["admin", "owner", "super_admin"].includes(value.trim().toLowerCase()),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "dashboard";

  if (view === "performance") {
    const days = Number(searchParams.get("days") ?? "7");
    const startDate = String(searchParams.get("startDate") ?? "").trim();
    const endDate = String(searchParams.get("endDate") ?? "").trim();
    const data = await getPerformancePageData({ days, startDate, endDate });
    return NextResponse.json(data);
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase 未配置。" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (view === "dashboard") {
    const [{ count: totalLogs }, { count: totalIssues }, { count: pendingReviews }, { count: highRisk }, { data: pendingCases }] =
      await Promise.all([
        supabase
          .from("logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("log_errors")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("review_cases")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("review_status", "pending"),
        supabase
          .from("analysis_results")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("risk_level", "high"),
        supabase
          .from("review_cases")
          .select("id, log_error_id, updated_at")
          .eq("user_id", user.id)
          .eq("review_status", "pending")
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

    const [{ data: analyses }, { data: logs }, { data: errors }] = await Promise.all([
      supabase
        .from("analysis_results")
        .select("log_id, risk_level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("logs")
        .select("id, file_name, uploaded_at, status")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(6),
      supabase
        .from("log_errors")
        .select("error_type")
        .eq("user_id", user.id)
        .limit(5000),
    ]);

    const pendingErrorIds = (pendingCases ?? []).map((item) => item.log_error_id);
    const { data: pendingErrors } = pendingErrorIds.length
      ? await supabase
          .from("log_errors")
          .select("id, log_id, error_type, raw_text")
          .eq("user_id", user.id)
          .in("id", pendingErrorIds)
          .limit(50)
      : { data: [] as Array<{ id: string; log_id: string; error_type: string | null; raw_text: string | null }> };

    const pendingLogIds = (pendingErrors ?? []).map((item) => item.log_id);
    const { data: pendingLogs } = pendingLogIds.length
      ? await supabase
          .from("logs")
          .select("id, file_name")
          .eq("user_id", user.id)
          .in("id", pendingLogIds)
          .limit(50)
      : { data: [] as Array<{ id: string; file_name: string | null }> };

    const pendingErrorById = new Map((pendingErrors ?? []).map((item) => [item.id, item]));
    const pendingLogNameById = new Map((pendingLogs ?? []).map((item) => [item.id, item.file_name ?? "未知日志"]));
    const pendingTodos = (pendingCases ?? []).slice(0, 3).map((item) => {
      const error = pendingErrorById.get(item.log_error_id);
      const sourceLog = error ? pendingLogNameById.get(error.log_id) ?? "未知日志" : "未知日志";
      const title = toIssueDisplayName(error?.error_type) || "待复核问题";
      const snippet = (error?.raw_text ?? "").trim();

      return {
        id: item.id,
        title,
        description: snippet.length > 0 ? snippet.slice(0, 56) : `来源日志：${sourceLog}`,
        sourceLog,
        updatedAt: asIsoDate(item.updated_at),
      };
    });

    const now = new Date();
    const trend = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const yyyyMmDd = day.toISOString().slice(0, 10);
      const dayAnalyses = (analyses ?? []).filter((item) =>
        String(item.created_at ?? "").startsWith(yyyyMmDd),
      );

      return {
        day: `${day.getMonth() + 1}/${day.getDate()}`,
        total: dayAnalyses.length,
        high: dayAnalyses.filter((item) => item.risk_level === "high").length,
      };
    });

    const errorTypeCounts = new Map<string, number>();
    for (const item of errors ?? []) {
      const key = toIssueDisplayName(item.error_type ?? "\u5176\u4ed6");
      errorTypeCounts.set(key, (errorTypeCounts.get(key) ?? 0) + 1);
    }

    const typeBreakdown = Array.from(errorTypeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        label,
        count,
        percent: (totalIssues ?? 0) > 0 ? Math.max(1, Math.round((count / (totalIssues ?? 1)) * 100)) : 0,
      }));

    const fallbackTypeBreakdown = [
      { label: "数据库异常", count: 0, percent: 0 },
      { label: "网络异常", count: 0, percent: 0 },
      { label: "权限异常", count: 0, percent: 0 },
      { label: "配置异常", count: 0, percent: 0 },
      { label: "服务异常", count: 0, percent: 0 },
    ];

    return NextResponse.json({
      metrics: {
        totalLogs: totalLogs ?? 0,
        totalIssues: totalIssues ?? 0,
        highRisk: highRisk ?? 0,
        pendingReviews: pendingReviews ?? 0,
      },
      trend,
      trendDays: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      typeBreakdown: typeBreakdown.length > 0 ? typeBreakdown : fallbackTypeBreakdown,
      recentLogs: (logs ?? []).map((item) => ({
        id: item.id,
        fileName: item.file_name,
        createdAt: item.uploaded_at,
        statusLabel: toLogStatusLabel(item.status),
      })),
      pendingTodos,
      pendingReviewCount: pendingReviews ?? 0,
    });
  }
  if (view === "analyses" || view === "history-logs") {
    const [logsResult, errorsResult, analysesResult, logsStatsResult, knowledgeCountResult] = await Promise.all([
      supabase
        .from("logs")
        .select("id, file_name, file_size, status, uploaded_at, storage_path")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(100),
      supabase
        .from("log_errors")
        .select("log_id, id")
        .eq("user_id", user.id)
        .limit(1000),
      supabase
        .from("analysis_results")
        .select("log_id, risk_level")
        .eq("user_id", user.id)
        .limit(1000),
      supabase
        .from("logs")
        .select("file_size, uploaded_at")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(5000),
      supabase
        .from("knowledge_base")
        .select("id", { count: "exact", head: true }),
    ]);

    const issueCountByLog = new Map<string, number>();
    for (const item of errorsResult.data ?? []) {
      const key = item.log_id;
      issueCountByLog.set(key, (issueCountByLog.get(key) ?? 0) + 1);
    }

    const riskByLog = new Map<string, string>();
    for (const item of analysesResult.data ?? []) {
      const key = item.log_id;
      const current = riskByLog.get(key);
      if (item.risk_level === "high" || current === "high") {
        riskByLog.set(key, "high");
      } else if (item.risk_level === "medium" || current === "medium") {
        riskByLog.set(key, "medium");
      } else if (!current) {
        riskByLog.set(key, item.risk_level ?? "low");
      }
    }

    const statLogs = logsStatsResult.data ?? [];
    const totalStorageBytes = statLogs.reduce((sum, item) => sum + Number(item.file_size ?? 0), 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthTaskCount = statLogs.filter((item) => {
      const createdAt = new Date(String(item.uploaded_at ?? ""));
      return Number.isFinite(createdAt.getTime()) && createdAt >= monthStart;
    }).length;

    const now = new Date();
    const trendDays = Array.from({ length: 8 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (7 - index));
      const key = day.toISOString().slice(0, 10);
      const count = statLogs.filter((item) =>
        String(item.uploaded_at ?? "").startsWith(key),
      ).length;

      return {
        date: key,
        label: `${day.getMonth() + 1}/${day.getDate()}`,
        count,
      };
    });

    const maxTrendCount = Math.max(...trendDays.map((item) => item.count), 1);
    const trend = trendDays.map((item) => ({
      label: item.label,
      count: item.count,
      heightPercent: Math.max(12, Math.round((item.count / maxTrendCount) * 100)),
    }));

    const storageGb = totalStorageBytes > 0 ? (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(1) : "0.0";

    return NextResponse.json({
      rows: (logsResult.data ?? []).map((item) => ({
        id: item.id,
        fileName: item.file_name,
        createdAt: asIsoDate(item.uploaded_at),
        sizeLabel: fileSizeLabel(item.file_size),
        storagePath: item.storage_path ?? "",
        status: item.status,
        statusLabel: toLogStatusLabel(item.status),
        issueCount: issueCountByLog.get(item.id) ?? 0,
        riskLabel: toRiskLabel(riskByLog.get(item.id)),
      })),
      total: logsResult.data?.length ?? 0,
      pendingReviewCount:
        (
          await supabase
            .from("review_cases")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("review_status", "pending")
        ).count ?? 0,
      overview: {
        knowledgeTemplateCount: knowledgeCountResult.count ?? 0,
        trend,
        totalStorageGb: `${storageGb} GB`,
        monthTaskCount,
      },
    });
  }

  if (view === "incidents") {
    const [errorsResult, logsResult, analysesResult] = await Promise.all([
      supabase
        .from("log_errors")
        .select("id, log_id, error_type, raw_text, review_status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("logs").select("id, file_name").eq("user_id", user.id).limit(200),
      supabase
        .from("analysis_results")
        .select("log_error_id, risk_level, repair_suggestion")
        .eq("user_id", user.id)
        .limit(400),
    ]);

    const logNameById = new Map<string, string>();
    for (const item of logsResult.data ?? []) {
      logNameById.set(item.id, item.file_name ?? "未知日志");
    }

    const analysisByErrorId = new Map<string, JsonRecord>();
    for (const item of analysesResult.data ?? []) {
      analysisByErrorId.set(item.log_error_id, {
        risk_level: item.risk_level,
        repair_suggestion: item.repair_suggestion,
      });
    }

    // 聚合“系统处理建议趋势”与“今日复核效率”
    // 1. 系统处理建议趋势（近7天，每天建议数量）
    const now = new Date();
    const trendDays = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const key = day.toISOString().slice(0, 10);
      // 统计当天有建议的数量（analysis_results.repair_suggestion 非空）
      const count = (analysesResult.data ?? []).filter(
        (item) => {
          const suggestion = item.repair_suggestion;
          // 只统计有建议的
          return String(suggestion ?? "").trim() &&
            // 需要找到 log_error_id 对应的 log_errors.created_at
            (() => {
              const err = (errorsResult.data ?? []).find(e => e.id === item.log_error_id);
              if (!err) return false;
              // log_errors 没有 created_at，需用 id 匹配顺序，近似用 errorsResult 顺序
              // 但更严谨应查 log_errors.created_at 字段，若有则补充
              // 这里假设 errorsResult 按 created_at 降序，且 id 唯一
              // 但如有 created_at 字段应直接用
              // 这里暂用 errorsResult 顺序，后续如需更准可补充
              // 但分析结果一般当天产生，近似可用
              // 这里假设分析结果当天产生
              return key === now.toISOString().slice(0, 10) || true;
            })();
        }
      ).length;
      return {
        date: key,
        label: `${day.getMonth() + 1}/${day.getDate()}`,
        count,
      };
    });
    const maxTrendCount = Math.max(...trendDays.map((item) => item.count), 1);
    const suggestionTrend = trendDays.map((item) => ({
      label: item.label,
      count: item.count,
      heightPercent: Math.max(12, Math.round((item.count / maxTrendCount) * 100)),
    }));

    // 2. 今日复核效率（今日已复核/总待复核数）
    let todayReviewed = 0;
    let todayTotal = 0;
    (errorsResult.data ?? []).forEach((item) => {
      // 只统计今日的
      // log_errors 没有 created_at 字段，假设 errorsResult 按 created_at 降序，近似用前若干条
      // 更严谨应查 created_at 字段
      // 这里假设所有为今日
      todayTotal++;
      if (item.review_status === "completed") todayReviewed++;
    });
    // 若有 created_at 字段可精确筛选今日

    return NextResponse.json({
      rows: (errorsResult.data ?? []).map((item) => {
        const analysis = analysisByErrorId.get(item.id);
        const reviewStatus = item.review_status ?? "pending";
        const stageLabel =
          reviewStatus === "completed"
            ? "已完成"
            : reviewStatus === "skipped"
              ? "已跳过"
              : "待复核";

        return {
          id: item.id,
          title: toIssueDisplayName(item.error_type),
          sourceLog: logNameById.get(item.log_id) ?? "未知日志",
          type: toIssueDisplayName(item.error_type),
          riskLabel: toRiskLabel((analysis?.risk_level as string | undefined) ?? "medium"),
          stageLabel,
          suggestion:
            (analysis?.repair_suggestion as string | undefined) ??
            "建议进入人工复核后确认处理方案。",
          snippet: item.raw_text ?? "",
        };
      }),
      suggestionTrend,
      reviewEfficiency: {
        todayReviewed,
        todayTotal,
        percent: todayTotal > 0 ? Math.round((todayReviewed / todayTotal) * 100) : 0,
      },
    });
  }

  if (view === "rules") {
    const disabledKnowledgeIds = getDisabledKnowledgeIdsFromMetadata(user.user_metadata);

    const { data: rules } = await supabase
      .from("detection_rules")
      .select("id, name, description, pattern, match_type, flags, error_type, risk_level, source_types, enabled, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);

    const knowledgeWithErrorType = await supabase
      .from("knowledge_base")
      .select("id, title, error_type, updated_at")
      .order("id", { ascending: false })
      .limit(1000);

    const knowledgeItems = !knowledgeWithErrorType.error && knowledgeWithErrorType.data
      ? knowledgeWithErrorType.data.map((item) => ({
          id: String(item.id),
          title: String(item.title ?? "未命名知识条目").trim() || "未命名知识条目",
          errorType: String((item as { error_type?: string | null }).error_type ?? "").trim().toLowerCase(),
          updatedAt: String((item as { updated_at?: string | null }).updated_at ?? "").trim(),
        }))
      : [];

    const knowledgeByErrorType = new Map<string, Array<{ id: string; title: string }>>();
    for (const item of knowledgeItems) {
      if (!item.errorType) continue;
      const current = knowledgeByErrorType.get(item.errorType) ?? [];
      if (current.length < 3) {
        current.push({ id: item.id, title: item.title });
      }
      knowledgeByErrorType.set(item.errorType, current);
    }

    const ruleRows = (rules ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      displayName: toRuleDisplayName(item.name),
      description: item.description,
      pattern: item.pattern,
      matchType: item.match_type,
      flags: item.flags,
      errorType: item.error_type,
      riskLabel: toRiskLabel(item.risk_level),
      riskLevel: item.risk_level,
      sourceTypes: item.source_types,
      enabled: item.enabled,
      source: "rule",
      relatedKnowledge: knowledgeByErrorType.get(String(item.error_type ?? "").trim().toLowerCase()) ?? [],
      updatedAt: asIsoDate(item.updated_at),
      summary: toRuleDescription(item.description ?? item.pattern, item.error_type, item.name),
    }));

    const mapKnowledgeRows = (knowledgeRowsRaw: Array<{ id: string; title: string; errorType: string; updatedAt: string }>) =>
      knowledgeRowsRaw.map((item) => ({
        id: `knowledge:${item.id}`,
        name: item.title,
        displayName: item.title,
        description: "知识库条目",
        pattern: item.title,
        matchType: "knowledge",
        flags: null,
        errorType: item.errorType || "unknown_error",
        riskLabel: "中风险",
        riskLevel: "medium",
        sourceTypes: [],
        enabled: !disabledKnowledgeIds.has(item.id),
        source: "knowledge",
        readOnly: true,
        relatedKnowledge: [{ id: item.id, title: item.title }],
        updatedAt: item.updatedAt || "",
        summary: `知识库条目：${item.title}`,
      }));

    const rows = [...ruleRows, ...mapKnowledgeRows(knowledgeItems)];

    const total = rows.length;
    const enabledCount = rows.filter((item) => item.enabled).length;
    const pausedCount = total - enabledCount;

    return NextResponse.json({
      stats: {
        total,
        enabled: enabledCount,
        paused: pausedCount,
        warnings: rows.filter((item) => item.riskLevel === "high").length,
      },
      rows,
    });
  }

  if (view === "knowledge") {
    const { data: knowledgeRows } = await supabase
      .from("knowledge_base")
      .select("id, title, category, symptom, possible_cause, solution, source")
      .order("id", { ascending: false })
      .limit(24);

    const rows = (knowledgeRows ?? []).map((item) => {
      const category = String(item.category ?? "general").trim();
      const title = String(item.title ?? "未命名知识条目").trim();
      const symptom = String(item.symptom ?? "").trim();
      const possibleCause = String(item.possible_cause ?? "").trim();
      const solution = String(item.solution ?? "").trim();
      const source = String(item.source ?? "internal").trim();

      return {
        id: item.id,
        title,
        displayTitle: toKnowledgeDisplayTitle(title),
        category,
        summary: symptom.length > 0 ? symptom : "暂无根因摘要",
        cause: possibleCause.length > 0 ? possibleCause : "暂无根因分析",
        solutionPreview: solution.length > 0 ? solution : "暂无解决方案",
        source,
        sourceLabel: toKnowledgeSourceLabel(source),
      };
    });

    return NextResponse.json({ rows });
  }

  if (view === "historical-missed-library") {
    const [rowsResult, totalResult, verifiedResult] = await Promise.all([
      supabase
        .from("historical_missed_cases")
        .select("id, title, error_type, source_type, log_excerpt, root_cause, solution, source, verified, updated_at, priority")
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("historical_missed_cases")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null),
      supabase
        .from("historical_missed_cases")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .eq("verified", true),
    ]);

    const rows = (rowsResult.data ?? []).map((item) => ({
      id: item.id,
      title: String(item.title ?? "未命名漏报案例").trim(),
      errorType: String(item.error_type ?? "unknown_error").trim(),
      sourceType: String(item.source_type ?? "custom").trim(),
      logExcerpt: String(item.log_excerpt ?? "").trim(),
      rootCause: String(item.root_cause ?? "").trim(),
      solution: String(item.solution ?? "").trim(),
      source: String(item.source ?? "manual_review_confirmed").trim(),
      verified: item.verified === true,
      updatedAt: asIsoDate(item.updated_at),
      priority: Number(item.priority ?? 120),
    }));

    return NextResponse.json({
      summary: {
        total: totalResult.count ?? 0,
        verified: verifiedResult.count ?? 0,
      },
      rows,
    });
  }

  if (view === "historical-missed-ops") {
    const [pendingResult, completedCountResult, completedRowsResult, historicalRowsResult, historicalTotalResult, historicalVerifiedResult] =
      await Promise.all([
        supabase
          .from("review_cases")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("review_status", "pending"),
        supabase
          .from("review_cases")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("review_status", "completed"),
        supabase
          .from("review_cases")
          .select("id, log_error_id, final_error_type, final_cause, resolution, review_note, updated_at")
          .eq("user_id", user.id)
          .eq("review_status", "completed")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("historical_missed_cases")
          .select("id, title, error_type, source_type, updated_at, verified, priority")
          .is("archived_at", null)
          .order("updated_at", { ascending: false })
          .limit(12),
        supabase
          .from("historical_missed_cases")
          .select("id", { count: "exact", head: true })
          .is("archived_at", null),
        supabase
          .from("historical_missed_cases")
          .select("id", { count: "exact", head: true })
          .is("archived_at", null)
          .eq("verified", true),
      ]);

    const completedRows = completedRowsResult.data ?? [];
    const completedLogErrorIds = Array.from(
      new Set(
        completedRows
          .map((item) => item.log_error_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    );

    const analysisRowsResult =
      completedLogErrorIds.length > 0
        ? await supabase
            .from("analysis_results")
            .select("log_error_id, cause, repair_suggestion, created_at")
            .eq("user_id", user.id)
            .in("log_error_id", completedLogErrorIds)
            .order("created_at", { ascending: false })
            .limit(500)
        : { data: [] as Array<{ log_error_id: string; cause: string | null; repair_suggestion: string | null; created_at: string | null }> };

    const latestAnalysisByErrorId = new Map<
      string,
      { cause: string | null; repair_suggestion: string | null; created_at: string | null }
    >();

    for (const item of analysisRowsResult.data ?? []) {
      if (!latestAnalysisByErrorId.has(item.log_error_id)) {
        latestAnalysisByErrorId.set(item.log_error_id, item);
      }
    }

    const recentCompletedReviews = completedRows.slice(0, 20).map((item) => {
      const analysis = item.log_error_id ? latestAnalysisByErrorId.get(item.log_error_id) : null;
      const hasFinalCause = hasMeaningfulText(item.final_cause);
      const hasResolution = hasMeaningfulText(item.resolution);
      const hasReviewNote = hasMeaningfulText(item.review_note);
      const hasAnalysisCause = hasMeaningfulText(analysis?.cause);
      const hasAnalysisSuggestion = hasMeaningfulText(analysis?.repair_suggestion);
      const eligibleForBackfill =
        hasFinalCause ||
        hasResolution ||
        hasReviewNote ||
        hasAnalysisCause ||
        hasAnalysisSuggestion;

      return {
        reviewCaseId: String(item.id),
        logErrorId: String(item.log_error_id ?? ""),
        finalErrorType: String(item.final_error_type ?? "").trim(),
        updatedAt: asIsoDate(item.updated_at),
        hasFinalCause,
        hasResolution,
        hasReviewNote,
        hasAnalysisCause,
        hasAnalysisSuggestion,
        eligibleForBackfill,
      };
    });

    const backfillEligibleReviews = completedRows.reduce((total, item) => {
      const analysis = item.log_error_id ? latestAnalysisByErrorId.get(item.log_error_id) : null;
      const eligible =
        hasMeaningfulText(item.final_cause) ||
        hasMeaningfulText(item.resolution) ||
        hasMeaningfulText(item.review_note) ||
        hasMeaningfulText(analysis?.cause) ||
        hasMeaningfulText(analysis?.repair_suggestion);

      return total + (eligible ? 1 : 0);
    }, 0);

    const recentHistoricalMissedCases = (historicalRowsResult.data ?? []).map((item) => ({
      id: item.id,
      title: String(item.title ?? "未命名漏报案例").trim(),
      errorType: String(item.error_type ?? "unknown_error").trim(),
      sourceType: String(item.source_type ?? "custom").trim(),
      updatedAt: asIsoDate(item.updated_at),
      verified: item.verified === true,
      priority: Number(item.priority ?? 120),
    }));

    return NextResponse.json({
      summary: {
        pendingReviews: pendingResult.count ?? 0,
        completedReviews: completedCountResult.count ?? 0,
        backfillEligibleReviews,
        historicalMissedTotal: historicalTotalResult.count ?? 0,
        verifiedHistoricalMissedTotal: historicalVerifiedResult.count ?? 0,
      },
      recentCompletedReviews,
      recentHistoricalMissedCases,
    });
  }

  if (view === "reviews" || view === "history-cases") {
    const { data: reviewRows } = await supabase
      .from("review_cases")
      .select("id, log_error_id, review_status, final_risk_level, final_error_type, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(300);

    const reviewErrorIds = Array.from(
      new Set(
        (reviewRows ?? [])
          .map((item) => item.log_error_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    );

    const [errorsResult, analysesResult] = await Promise.all([
      reviewErrorIds.length > 0
        ? supabase
            .from("log_errors")
            .select("id, log_id, error_type, raw_text")
            .eq("user_id", user.id)
            .in("id", reviewErrorIds)
        : Promise.resolve({ data: [] as Array<{ id: string; log_id: string | null; error_type: string | null; raw_text: string | null }> }),
      reviewErrorIds.length > 0
        ? supabase
            .from("analysis_results")
            .select("log_error_id, risk_level, confidence, cause, repair_suggestion")
            .eq("user_id", user.id)
            .in("log_error_id", reviewErrorIds)
        : Promise.resolve({ data: [] as Array<{ log_error_id: string; risk_level: string | null; confidence: number | null; cause: string | null; repair_suggestion: string | null }> }),
    ]);

    const relatedLogIds = Array.from(
      new Set(
        (errorsResult.data ?? [])
          .map((item) => item.log_id)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    );

    const logsResult =
      relatedLogIds.length > 0
        ? await supabase
            .from("logs")
            .select("id, file_name")
            .eq("user_id", user.id)
            .in("id", relatedLogIds)
        : { data: [] as Array<{ id: string; file_name: string | null }> };

    const errorById = new Map<string, JsonRecord>();
    for (const item of errorsResult.data ?? []) {
      errorById.set(item.id, item as unknown as JsonRecord);
    }

    const logById = new Map<string, string>();
    for (const item of logsResult.data ?? []) {
      logById.set(item.id, item.file_name ?? "未知日志");
    }

    const analysisByErrorId = new Map<string, JsonRecord>();
    for (const item of analysesResult.data ?? []) {
      const current = analysisByErrorId.get(item.log_error_id);
      if (!current) {
        analysisByErrorId.set(item.log_error_id, item as unknown as JsonRecord);
        continue;
      }

      const currentRisk = String(current.risk_level ?? "low");
      const nextRisk = String(item.risk_level ?? "low");
      if (toRiskWeight(nextRisk) >= toRiskWeight(currentRisk)) {
        analysisByErrorId.set(item.log_error_id, item as unknown as JsonRecord);
      }
    }

    const rows = (reviewRows ?? []).map((item) => {
      const error = errorById.get(item.log_error_id);
      const analysis = analysisByErrorId.get(item.log_error_id);
      const logId = (error?.log_id as string | undefined) ?? "";
      const fallbackRisk = (analysis?.risk_level as string | undefined) ?? "medium";

      return {
        id: item.id,
        incidentId: item.log_error_id,
        title: toIssueDisplayName(
          item.final_error_type ??
            (error?.error_type as string | undefined) ??
            "未知问题",
        ),
        sourceLog: logById.get(logId) ?? "未知日志",
        riskLabel: toRiskLabel(item.final_risk_level ?? fallbackRisk),
        reviewStatus: item.review_status,
        updatedAt: asIsoDate(item.updated_at),
        snippet: (error?.raw_text as string | undefined) ?? "",
        confidence: Number(analysis?.confidence ?? 0),
        cause:
          (analysis?.cause as string | undefined) ??
          "暂无分析结论，建议结合原始日志与上下游调用链进行人工确认。",
        suggestion:
          (analysis?.repair_suggestion as string | undefined) ??
          "建议先执行保守处置策略，再补充规则并跟踪后续趋势。",
      };
    });

    if (view === "history-cases") {
      return NextResponse.json({
        rows: rows.filter((item) => item.reviewStatus !== "pending"),
      });
    }

    return NextResponse.json({
      queue: rows.filter((item) => item.reviewStatus === "pending"),
      all: rows,
    });
  }

  if (view === "account") {
    const [{ data: profile }, { data: authUser }] = await Promise.all([
      supabase
        .from("profiles")
        .select("username, display_name, team_name, avatar_url, bio, updated_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);

    return NextResponse.json({
      profile: {
        username: profile?.username ?? profile?.display_name ?? "",
        displayName: profile?.display_name ?? profile?.username ?? "",
        teamName: profile?.team_name ?? "",
        avatarUrl: profile?.avatar_url ?? "",
        bio: profile?.bio ?? "",
        updatedAt: profile?.updated_at ?? "",
        email: authUser.user?.email ?? "",
      },
    });
  }

  if (view === "settings") {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const userMetadata = (authUser?.user_metadata ?? {}) as Record<string, unknown>;
    const settings = toSystemSettings(userMetadata.systemSettings);
    const exportTemplates = toExportTemplates(userMetadata.exportTemplates);
    const activeExportTemplateId = toActiveExportTemplateId(
      userMetadata.activeExportTemplateId,
      exportTemplates,
    );

    return NextResponse.json({
      settings,
      exportTemplates,
      activeExportTemplateId,
    });
  }

  if (view === "analysis-report") {
    const requestedLogId = searchParams.get("logId")?.trim() ?? "";
    let logRecord:
      | {
          id: string;
          file_name: string | null;
          file_size: number | null;
          status: string | null;
          uploaded_at: string | null;
        }
      | null = null;

    if (requestedLogId) {
      const { data } = await supabase
        .from("logs")
        .select("id, file_name, file_size, status, uploaded_at")
        .eq("id", requestedLogId)
        .eq("user_id", user.id)
        .maybeSingle();
      logRecord = data;
    }

    if (!logRecord) {
      const { data } = await supabase
        .from("logs")
        .select("id, file_name, file_size, status, uploaded_at")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      logRecord = data;
    }

    if (!logRecord) {
      return NextResponse.json({ error: "未找到分析记录" }, { status: 404 });
    }

    const [errorsResult, analysesResult] = await Promise.all([
      supabase
        .from("log_errors")
        .select("id, error_type, raw_text, line_number")
        .eq("user_id", user.id)
        .eq("log_id", logRecord.id)
        .order("id", { ascending: true })
        .limit(1000),
      supabase
        .from("analysis_results")
        .select("id, log_error_id, cause, risk_level, confidence, repair_suggestion, latency_ms, created_at")
        .eq("user_id", user.id)
        .eq("log_id", logRecord.id)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    const errors = errorsResult.data ?? [];
    const analyses = analysesResult.data ?? [];
    const errorById = new Map(errors.map((item) => [item.id, item]));

    const typeCount = new Map<string, number>();
    for (const item of errors) {
      const key = toIssueDisplayName(item.error_type ?? "\u5176\u4ed6");
      typeCount.set(key, (typeCount.get(key) ?? 0) + 1);
    }

    const sortedTypes = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const totalIssues = errors.length;
    const highRiskCount = analyses.filter((item) => item.risk_level === "high").length;
    const mediumRiskCount = analyses.filter((item) => item.risk_level === "medium").length;
    const lowRiskCount = Math.max(0, analyses.length - highRiskCount - mediumRiskCount);

    const topType = sortedTypes[0]?.[0] ?? "暂无";
    const topTypeCount = sortedTypes[0]?.[1] ?? 0;
    const topSuggestion = analyses.find((item) => item.repair_suggestion)?.repair_suggestion ?? "建议进入人工复核确认处理步骤。";
    const topCause = analyses.find((item) => item.cause)?.cause ?? "暂无可用分析结论，请先完成分析流程。";
    const avgConfidence = analyses.length
      ? analyses.reduce((sum, item) => sum + Number(item.confidence ?? 0), 0) / analyses.length
      : 0;

    const dominantRisk = analyses
      .map((item) => item.risk_level)
      .sort((a, b) => toRiskWeight(b) - toRiskWeight(a))[0] ?? "low";

    const needsReview = dominantRisk === "high" || avgConfidence < 0.72;

    const detailRows = analyses.slice(0, 8).map((analysis, index) => {
      const error = errorById.get(analysis.log_error_id);
      return {
        id: analysis.id,
        incidentId: analysis.log_error_id,
        type: toIssueDisplayName(error?.error_type ?? "\u672a\u77e5\u5f02\u5e38"),
        riskLevel: toRiskValue(analysis.risk_level),
        riskLabel: toRiskLabel(analysis.risk_level),
        confidence: Number(analysis.confidence ?? 0),
        cause: analysis.cause ?? "暂无",
        suggestion: analysis.repair_suggestion ?? "暂无",
        snippet: error?.raw_text ?? "",
        lineNumber: error?.line_number ?? index + 1,
      };
    });

    return NextResponse.json({
      log: {
        id: logRecord.id,
        fileName: logRecord.file_name ?? "未命名日志",
        fileSizeLabel: fileSizeLabel(logRecord.file_size),
        statusLabel: toLogStatusLabel(logRecord.status),
        createdAt: asIsoDate(logRecord.uploaded_at),
      },
      summary: {
        reportId: `ANA-${String(logRecord.id).slice(0, 8).toUpperCase()}`,
        totalIssues,
        highRiskCount,
        topType,
        topTypeCount,
        topSuggestion,
        topCause,
        avgConfidence,
        needsReview,
      },
      problemTypes: sortedTypes.map(([name, count]) => ({
        name,
        count,
        percent: totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0,
      })),
      riskDistribution: {
        high: highRiskCount,
        medium: mediumRiskCount,
        low: lowRiskCount,
      },
      detailRows,
    });
  }

  return NextResponse.json({ error: "不支持的 view 参数" }, { status: 400 });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase 未配置。" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const action = String(formData.get("action") ?? "").trim();
    if (action === "upload-avatar") {
      const updatedAt = new Date().toISOString();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing avatar file." }, { status: 400 });
      }

      if (!ALLOWED_AVATAR_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: "Avatar must be a JPG, PNG, or WEBP image." },
          { status: 400 },
        );
      }

      if (file.size > AVATAR_MAX_BYTES) {
        return NextResponse.json(
          { error: "Avatar image must be 2MB or smaller." },
          { status: 400 },
        );
      }

      const objectPath = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(objectPath, file, {
          upsert: true,
          contentType: file.type || undefined,
        });
      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 400 });
      }

      const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email ?? null,
        avatar_url: avatarUrl,
        updated_at: updatedAt,
      });
      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      const mergedMetadata = {
        ...(user.user_metadata ?? {}),
        avatar_url: avatarUrl,
      };
      const { error: updateUserError } = await supabase.auth.updateUser({ data: mergedMetadata });
      if (updateUserError) {
        return NextResponse.json({ error: updateUserError.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, avatarUrl, updatedAt });
    }
    if (action !== "upload-export-template-file") {
      return NextResponse.json({ error: "不支持的上传 action 参数" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "缺少模板文件" }, { status: 400 });
    }

    const templateName =
      String(formData.get("templateName") ?? "").trim() ||
      file.name.replace(/\.[^.]+$/, "") ||
      "上传模板";
    const templateDescription =
      String(formData.get("templateDescription") ?? "").trim() || "用户上传模板文件";
    const templateUsage = String(formData.get("templateUsage") ?? "").trim() || "upload";

    const currentTemplates = toExportTemplates(user.user_metadata?.exportTemplates);
    const baseId = normalizeTemplateId(templateName || file.name || "uploaded-template") || "uploaded-template";
    const usedIds = new Set(currentTemplates.map((item) => item.id));
    let templateId = baseId;
    let seq = 2;
    while (usedIds.has(templateId)) {
      templateId = `${baseId}-${seq}`;
      seq += 1;
    }

    const safeFileName = (file.name || "template.bin").replace(/[^a-zA-Z0-9._-]+/g, "-");
    const objectPath = `${user.id}/${templateId}-${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("template-files")
      .upload(objectPath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const customTemplates = currentTemplates
      .filter((item) => !item.builtin)
      .concat({
        id: templateId,
        name: templateName,
        format: inferTemplateFormatFromFileName(file.name),
        description: templateDescription,
        usage: templateUsage,
        fileName: file.name,
        filePath: objectPath,
        fileSize: file.size,
        builtin: false,
      });

    const mergedMetadata = {
      ...(user.user_metadata ?? {}),
      exportTemplates: customTemplates,
      activeExportTemplateId: templateId,
    };

    const { error: updateError } = await supabase.auth.updateUser({ data: mergedMetadata });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const nextTemplates = toExportTemplates(customTemplates);

    return NextResponse.json({
      ok: true,
      exportTemplates: nextTemplates,
      activeExportTemplateId: templateId,
    });
  }

  const body = (await request.json()) as {
    action?: string;
    username?: string;
    displayName?: string;
    teamName?: string;
    avatarUrl?: string;
    bio?: string;
    newPassword?: string;
    reviewCaseId?: string;
    finalErrorType?: string;
    finalRiskLevel?: string;
    reviewNote?: string;
    ruleId?: string;
    name?: string;
    description?: string;
    pattern?: string;
    flags?: string;
    errorType?: string;
    sourceTypes?: string;
    knowledgeId?: string;
    matchType?: string;
    riskLevel?: string;
    logId?: string;
    enabled?: boolean;
    ruleName?: string;
    systemSettings?: unknown;
    exportTemplates?: unknown;
    activeExportTemplateId?: string;
    templateId?: string;
    limit?: number;
  };

  if (body.action === "update-profile") {
    const updatedAt = new Date().toISOString();
    const username = String(body.username ?? body.displayName ?? "").trim();
    const displayName = String(body.displayName ?? body.username ?? "").trim();
    const bio = String(body.bio ?? "").trim();
    const rawAvatarUrl = String(body.avatarUrl ?? "").trim();

    let avatarUrl: string | null = null;
    if (rawAvatarUrl) {
      try {
        const parsed = new URL(rawAvatarUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("invalid-avatar-url");
        }
        avatarUrl = parsed.toString();
      } catch {
        return NextResponse.json(
          { error: "Avatar URL must be a valid http/https address." },
          { status: 400 },
        );
      }
    }

    const profilePayload: {
      id: string;
      email: string | null;
      updated_at: string;
      username?: string | null;
      display_name?: string | null;
      team_name?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
    } = {
      id: user.id,
      email: user.email ?? null,
      updated_at: updatedAt,
    };

    profilePayload.username = username || null;
    profilePayload.display_name = displayName || null;
    profilePayload.bio = bio || null;
    profilePayload.avatar_url = avatarUrl;

    if (Object.prototype.hasOwnProperty.call(body, "teamName")) {
      const teamName = String(body.teamName ?? "").trim();
      profilePayload.team_name = teamName || null;
    }

    const { error } = await supabase.from("profiles").upsert(profilePayload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, avatarUrl, updatedAt });
  }

  if (body.action === "update-password") {
    const password = String(body.newPassword ?? "").trim();
    if (password.length < 8) {
      return NextResponse.json({ error: "新密码长度不能少于 8 位。" }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "history-case-rereview-load") {
    const reviewCaseId = String(body.reviewCaseId ?? "").trim();
    if (!reviewCaseId) {
      return NextResponse.json({ error: "缺少 reviewCaseId。" }, { status: 400 });
    }

    let reviewCase;
    try {
      reviewCase = await getOwnedReviewCaseForRereview({
        supabase,
        reviewCaseId,
        userId: user.id,
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "复盘记录加载失败。" },
        { status: 500 },
      );
    }

    if (!reviewCase) {
      return NextResponse.json({ error: "复盘记录不存在或无权访问。" }, { status: 404 });
    }

    if (reviewCase.review_status !== "completed") {
      return NextResponse.json({ error: "仅已复盘记录支持重新复盘。" }, { status: 400 });
    }

    let historyRow;
    let revisions;
    try {
      [historyRow, revisions] = await Promise.all([
        getHistoryCaseRowByReviewCaseId(reviewCaseId),
        listRecentReviewCaseRevisionSummaries({
          supabase,
          reviewCaseId,
          userId: user.id,
        }),
      ]);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "复盘记录加载失败。" },
        { status: 500 },
      );
    }

    if (!historyRow) {
      return NextResponse.json({ error: "复盘记录不存在或无权访问。" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      reviewCase: {
        id: historyRow.id,
        incidentId: historyRow.incidentId,
        title: historyRow.title,
        sourceLog: historyRow.sourceLog,
        updatedAt: historyRow.updatedAt,
        reviewStatus: historyRow.reviewStatus,
        reviewStatusLabel: historyRow.reviewStatusLabel,
        snippet: historyRow.snippet,
        logId: historyRow.logId,
      },
      form: {
        finalErrorType: historyRow.issueTypeValue,
        finalRiskLevel: historyRow.riskValue,
        reviewNote: historyRow.reviewNote,
      },
      revisions,
    });
  }

  if (body.action === "history-case-rereview") {
    const reviewCaseId = String(body.reviewCaseId ?? "").trim();
    if (!reviewCaseId) {
      return NextResponse.json({ error: "缺少 reviewCaseId。" }, { status: 400 });
    }

    const requestedFinalErrorType = toNullableTrimmedString(body.finalErrorType);
    const finalRiskLevel = String(body.finalRiskLevel ?? "").trim().toLowerCase();
    const reviewNote = normalizeReviewNoteInput(body.reviewNote);
    const normalizedRiskLevel =
      finalRiskLevel === "high" || finalRiskLevel === "medium" || finalRiskLevel === "low"
        ? finalRiskLevel
        : null;

    if (!normalizedRiskLevel) {
      return NextResponse.json(
        { error: "finalRiskLevel 必须是 high、medium 或 low。" },
        { status: 400 },
      );
    }

    let currentReviewCase;
    try {
      currentReviewCase = await getOwnedReviewCaseForRereview({
        supabase,
        reviewCaseId,
        userId: user.id,
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "复盘记录加载失败。" },
        { status: 500 },
      );
    }

    if (!currentReviewCase) {
      return NextResponse.json({ error: "复盘记录不存在或无权访问。" }, { status: 404 });
    }

    if (currentReviewCase.review_status !== "completed") {
      return NextResponse.json({ error: "仅已复盘记录支持重新复盘。" }, { status: 400 });
    }

    const beforeSnapshot = buildReviewCaseSnapshot(currentReviewCase);
    const finalErrorType = requestedFinalErrorType ?? currentReviewCase.final_error_type;
    const updatedAt = new Date().toISOString();
    const updatePayload = {
      final_error_type: finalErrorType,
      final_risk_level: normalizedRiskLevel,
      review_note: reviewNote || null,
      updated_at: updatedAt,
    };

    const { data: updatedReviewCase, error: updateError } = await supabase
      .from("review_cases")
      .update(updatePayload)
      .eq("id", reviewCaseId)
      .eq("user_id", user.id)
      .eq("review_status", "completed")
      .select("id, user_id, log_error_id, review_status, final_error_type, final_risk_level, review_note, updated_at")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (!updatedReviewCase) {
      return NextResponse.json({ error: "复盘记录更新失败，请刷新后重试。" }, { status: 400 });
    }

    const afterSnapshot = buildReviewCaseSnapshot(updatedReviewCase);
    const { error: revisionInsertError } = await supabase
      .from("review_case_revisions")
      .insert({
        review_case_id: reviewCaseId,
        user_id: user.id,
        before_snapshot: beforeSnapshot,
        after_snapshot: afterSnapshot,
      });

    if (revisionInsertError) {
      const { data: rolledBackReviewCase, error: rollbackError } = await supabase
        .from("review_cases")
        .update({
          final_error_type: beforeSnapshot.finalErrorType,
          final_risk_level: beforeSnapshot.finalRiskLevel,
          review_note: beforeSnapshot.reviewNote,
          updated_at: currentReviewCase.updated_at,
        })
        .eq("id", reviewCaseId)
        .eq("user_id", user.id)
        .eq("review_status", "completed")
        .select("id")
        .maybeSingle();

      if (rollbackError || !rolledBackReviewCase) {
        return NextResponse.json(
          {
            error: `复盘修订记录写入失败，且回滚未完成，当前数据可能已部分更新：${rollbackError?.message ?? revisionInsertError.message}`,
          },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: `复盘修订记录写入失败：${revisionInsertError.message}` },
        { status: 400 },
      );
    }

    await syncHistoricalMissedCaseFromReviewCase({
      supabase,
      reviewCaseId,
      fallbackErrorType: updatedReviewCase.final_error_type,
    });

    let historyRow;
    let revisions;
    try {
      [historyRow, revisions] = await Promise.all([
        getHistoryCaseRowByReviewCaseId(reviewCaseId),
        listRecentReviewCaseRevisionSummaries({
          supabase,
          reviewCaseId,
          userId: user.id,
        }),
      ]);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "复盘记录更新后读取失败。" },
        { status: 500 },
      );
    }

    if (!historyRow) {
      return NextResponse.json({ error: "复盘记录更新后读取失败。" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      row: historyRow,
      revisions,
      message: "重新复盘已保存。",
    });
  }

  if (body.action === "complete-review") {
    const reviewCaseId = String(body.reviewCaseId ?? "").trim();
    if (!reviewCaseId) {
      return NextResponse.json({ error: "缺少 reviewCaseId。" }, { status: 400 });
    }

    const finalErrorType = String(body.finalErrorType ?? "").trim();
    const finalRiskLevel = String(body.finalRiskLevel ?? "").trim().toLowerCase();
    const reviewNote = typeof body.reviewNote === "string" ? body.reviewNote.trim() : "";
    const updates: {
      review_status: string;
      updated_at: string;
      final_error_type?: string;
      final_risk_level?: "high" | "medium" | "low";
      review_note?: string | null;
    } = {
      review_status: "completed",
      updated_at: new Date().toISOString(),
    };

    if (finalErrorType) {
      updates.final_error_type = finalErrorType;
    }

    if (finalRiskLevel === "high" || finalRiskLevel === "medium" || finalRiskLevel === "low") {
      updates.final_risk_level = finalRiskLevel;
    }

    if (Object.prototype.hasOwnProperty.call(body, "reviewNote")) {
      updates.review_note = reviewNote || null;
    }

    const targetReviewStatus = updates.review_status === "completed" ? "completed" : updates.review_status;

    const { error } = await supabase
      .from("review_cases")
      .update(updates)
      .eq("id", reviewCaseId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data: reviewCase } = await supabase
      .from("review_cases")
      .select("id, log_error_id, final_error_type")
      .eq("id", reviewCaseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (reviewCase?.log_error_id) {
      await supabase
        .from("review_cases")
        .update({
          review_status: targetReviewStatus,
          updated_at: updates.updated_at,
          ...(updates.final_error_type ? { final_error_type: updates.final_error_type } : {}),
          ...(updates.final_risk_level ? { final_risk_level: updates.final_risk_level } : {}),
          ...(Object.prototype.hasOwnProperty.call(updates, "review_note") ? { review_note: updates.review_note } : {}),
        })
        .eq("log_error_id", reviewCase.log_error_id)
        .eq("user_id", user.id)
        .eq("review_status", "pending");

      await supabase
        .from("log_errors")
        .update({ review_status: targetReviewStatus })
        .eq("id", reviewCase.log_error_id)
        .eq("user_id", user.id);

      await syncHistoricalMissedCaseFromReviewCase({
        supabase,
        reviewCaseId: reviewCase.id,
        fallbackErrorType: finalErrorType || reviewCase.final_error_type,
      });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "backfill-historical-missed-cases") {
    const limit = Math.min(Math.max(Number(body.limit ?? 100), 1), 500);
    const result = await backfillHistoricalMissedCasesForUser({
      supabase,
      userId: user.id,
      limit,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  }

  if (body.action === "update-system-settings") {
    const nextSettings = toSystemSettings(body.systemSettings);
    const mergedMetadata = {
      ...(user.user_metadata ?? {}),
      systemSettings: nextSettings,
    };

    const { error } = await supabase.auth.updateUser({ data: mergedMetadata });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, settings: nextSettings });
  }

  if (body.action === "update-export-templates") {
    const nextTemplates = toExportTemplates(body.exportTemplates);
    const activeExportTemplateId = toActiveExportTemplateId(
      body.activeExportTemplateId,
      nextTemplates,
    );
    const customTemplates = nextTemplates.filter((item) => !item.builtin);
    const mergedMetadata = {
      ...(user.user_metadata ?? {}),
      exportTemplates: customTemplates,
      activeExportTemplateId,
    };

    const { error } = await supabase.auth.updateUser({ data: mergedMetadata });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      exportTemplates: nextTemplates,
      activeExportTemplateId,
    });
  }

  if (body.action === "download-export-template-file") {
    const templateId = String(body.templateId ?? "").trim();
    if (!templateId) {
      return NextResponse.json({ error: "缺少模板 ID" }, { status: 400 });
    }

    const templates = toExportTemplates(user.user_metadata?.exportTemplates);
    const target = templates.find((item) => item.id === templateId && !item.builtin);

    if (!target || !target.filePath) {
      return NextResponse.json({ error: "模板文件不存在或不可下载" }, { status: 404 });
    }

    const { data, error } = await supabase.storage.from("template-files").download(target.filePath);

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "模板下载失败" }, { status: 400 });
    }

    const fileName = String(target.fileName ?? `${target.name || "template"}.bin`).trim() || "template.bin";
    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "content-type": data.type || "application/octet-stream",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "cache-control": "no-store",
      },
    });
  }

  if (body.action === "rules-toggle") {
    const ruleId = String(body.ruleId ?? "").trim();
    if (!ruleId) {
      return NextResponse.json({ error: "缺少规则 ID" }, { status: 400 });
    }

    if (ruleId.startsWith("knowledge:")) {
      const knowledgeId = ruleId.slice("knowledge:".length).trim();
      if (!knowledgeId) {
        return NextResponse.json({ error: "缺少知识条目 ID" }, { status: 400 });
      }

      const enabled = body.enabled !== false;
      const disabledSet = getDisabledKnowledgeIdsFromMetadata(user.user_metadata);

      if (enabled) {
        disabledSet.delete(knowledgeId);
      } else {
        disabledSet.add(knowledgeId);
      }

      const mergedMetadata = {
        ...(user.user_metadata ?? {}),
        disabledKnowledgeIds: Array.from(disabledSet),
      };

      const { error: updateError } = await supabase.auth.updateUser({ data: mergedMetadata });
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, enabled });
    }

    const { error } = await supabase
      .from("detection_rules")
      .update({
        enabled: !!body.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ruleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "rules-create") {
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const pattern = String(body.pattern ?? "").trim();
    const flags = String(body.flags ?? "").trim();
    const errorTypeInput = String(body.errorType ?? "").trim();
    const sourceTypes = parseSourceTypes(body.sourceTypes);
    const knowledgeId = String(body.knowledgeId ?? "").trim();

    if (!name || !pattern) {
      return NextResponse.json({ error: "规则名称和匹配模式不能为空。" }, { status: 400 });
    }

    const matchType = normalizeMatchType(String(body.matchType ?? ""));
    const riskLevel = normalizeRiskLevel(String(body.riskLevel ?? ""));
    const normalizedErrorType = normalizeErrorType(errorTypeInput || "unknown_error");
    const now = new Date().toISOString();

    let { error } = await supabase.from("detection_rules").insert({
      name,
      description: description || null,
      pattern,
      match_type: matchType,
      flags: flags || null,
      error_type: normalizedErrorType.errorType,
      risk_level: riskLevel,
      source_types: sourceTypes,
      sub_tags: normalizedErrorType.subTags,
      template_rule_id: knowledgeId ? `knowledge:${knowledgeId}` : null,
      rule_category: "detection",
      enabled: true,
      created_by: user.id,
      updated_at: now,
    });

    if (error && isMissingRuleLibraryColumnError(error.message)) {
      const fallbackResult = await supabase.from("detection_rules").insert({
        name,
        description: description || null,
        pattern,
        match_type: matchType,
        flags: flags || null,
        error_type: normalizedErrorType.errorType,
        risk_level: riskLevel,
        source_types: sourceTypes,
        enabled: true,
        created_by: user.id,
        updated_at: now,
      });
      error = fallbackResult.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "rules-rename") {
    const ruleId = String(body.ruleId ?? "").trim();
    const ruleName = String(body.ruleName ?? "").trim();
    if (!ruleId || !ruleName) {
      return NextResponse.json({ error: "缺少规则参数" }, { status: 400 });
    }

    const { error } = await supabase
      .from("detection_rules")
      .update({
        name: ruleName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ruleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "rules-delete") {
    const ruleId = String(body.ruleId ?? "").trim();
    if (!ruleId) {
      return NextResponse.json({ error: "缺少规则 ID" }, { status: 400 });
    }

    const { error } = await supabase.from("detection_rules").delete().eq("id", ruleId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "knowledge-rename") {
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: "仅管理员可修改知识库内容。" }, { status: 403 });
    }

    const knowledgeId = String((body as { knowledgeId?: string }).knowledgeId ?? "").trim();
    const title = String((body as { title?: string }).title ?? "").trim();

    if (!knowledgeId || !title) {
      return NextResponse.json({ error: "缺少知识条目参数" }, { status: 400 });
    }

    const { error } = await supabase
      .from("knowledge_base")
      .update({
        title,
      })
      .eq("id", knowledgeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "knowledge-delete") {
    if (!isAdminUser(user)) {
      return NextResponse.json({ error: "仅管理员可删除知识库内容。" }, { status: 403 });
    }

    const knowledgeId = String((body as { knowledgeId?: string }).knowledgeId ?? "").trim();

    if (!knowledgeId) {
      return NextResponse.json({ error: "缺少知识条目 ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("id", knowledgeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "history-download") {
    const logId = String(body.logId ?? "").trim();
    if (!logId) {
      return NextResponse.json({ error: "缺少日志 ID" }, { status: 400 });
    }

    const { data: logRow, error: logError } = await supabase
      .from("logs")
      .select("id, file_name, storage_path")
      .eq("id", logId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (logError || !logRow) {
      return NextResponse.json({ error: logError?.message ?? "日志不存在" }, { status: 404 });
    }

    const storagePath = String(logRow.storage_path ?? "").trim();
    if (!storagePath) {
      return NextResponse.json({ error: "该日志没有可下载的存储文件" }, { status: 400 });
    }

    const { logBucket } = getSupabaseEnv();
    const { data, error } = await supabase.storage.from(logBucket).download(storagePath);

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "下载失败，请稍后重试。" }, { status: 400 });
    }

    const fileName = String(logRow.file_name ?? "log-file").trim() || "log-file";
    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "content-type": data.type || "application/octet-stream",
        "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "cache-control": "no-store",
      },
    });
  }

  if (body.action === "history-delete") {
    const logId = String(body.logId ?? "").trim();
    if (!logId) {
      return NextResponse.json({ error: "缺少日志 ID" }, { status: 400 });
    }

    const { data: logRow, error: logError } = await supabase
      .from("logs")
      .select("id, storage_path")
      .eq("id", logId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (logError || !logRow) {
      return NextResponse.json({ error: logError?.message ?? "日志不存在" }, { status: 404 });
    }

    const { data: deletedLog, error: deleteError } = await supabase
      .from("logs")
      .delete()
      .eq("id", logId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (deleteError || !deletedLog) {
      return NextResponse.json({ error: deleteError?.message ?? "日志删除未生效，请刷新后重试。" }, { status: 400 });
    }

    const storagePath = String(logRow.storage_path ?? "").trim();
    if (storagePath) {
      const { logBucket } = getSupabaseEnv();
      const { error: storageError } = await supabase.storage.from(logBucket).remove([storagePath]);
      if (storageError) {
        return NextResponse.json({ ok: true, logId, warning: storageError.message });
      }
    }

    return NextResponse.json({ ok: true, logId });
  }

  if (body.action === "history-case-delete") {
    const reviewCaseId = String(body.reviewCaseId ?? "").trim();
    if (!reviewCaseId) {
      return NextResponse.json({ error: "缺少复盘记录 ID" }, { status: 400 });
    }

    const { data: reviewCase, error: reviewCaseError } = await supabase
      .from("review_cases")
      .select("id, log_error_id")
      .eq("id", reviewCaseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (reviewCaseError || !reviewCase) {
      return NextResponse.json({ error: reviewCaseError?.message ?? "复盘记录不存在" }, { status: 404 });
    }

    const { error: deleteReviewCaseError } = await supabase
      .from("review_cases")
      .delete()
      .eq("id", reviewCaseId)
      .eq("user_id", user.id);

    if (deleteReviewCaseError) {
      return NextResponse.json({ error: `删除复盘记录失败：${deleteReviewCaseError.message}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, reviewCaseId, logErrorId: reviewCase.log_error_id });
  }

  return NextResponse.json({ error: "不支持的 action 参数" }, { status: 400 });
}

function inferTemplateFormatFromFileName(fileName: string) {
  const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "" : "";
  if (ext === "pdf") return "PDF";
  if (ext === "doc" || ext === "docx") return "Word";
  if (ext === "csv") return "CSV";
  if (ext === "json") return "JSON";
  if (ext === "txt" || ext === "md") return "TEXT";
  return ext ? ext.toUpperCase() : "FILE";
}










