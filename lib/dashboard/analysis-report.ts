import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

export type AnalysisReportDetailRow = {
  id: string;
  incidentId: string;
  type: string;
  riskLevel: string;
  riskLabel: string;
  confidence: number;
  cause: string;
  suggestion: string;
  snippet: string;
  lineNumber: number;
};

export type AnalysisReportData = {
  log: {
    id: string;
    fileName: string;
    fileSizeLabel: string;
    status: string;
    statusLabel: string;
    createdAt: string;
  };
  summary: {
    reportId: string;
    totalIssues: number;
    highRiskCount: number;
    topType: string;
    topTypeCount: number;
    topSuggestion: string;
    topCause: string;
    avgConfidence: number;
    needsReview: boolean;
  };
  problemTypes: Array<{
    name: string;
    count: number;
    percent: number;
  }>;
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  detailRows: AnalysisReportDetailRow[];
};

const EMPTY_REPORT_DATA: AnalysisReportData = {
  log: {
    id: "",
    fileName: "未找到分析记录",
    fileSizeLabel: "-",
    status: "unknown",
    statusLabel: "未知",
    createdAt: new Date(0).toISOString(),
  },
  summary: {
    reportId: "-",
    totalIssues: 0,
    highRiskCount: 0,
    topType: "暂无",
    topTypeCount: 0,
    topSuggestion: "建议进入人工复核确认处理步骤。",
    topCause: "暂无可用分析结论，请先完成分析流程。",
    avgConfidence: 0,
    needsReview: false,
  },
  problemTypes: [],
  riskDistribution: { high: 0, medium: 0, low: 0 },
  detailRows: [],
};

const MAX_PROBLEM_TYPE_ITEMS = 8;

function asIsoDate(value: string | null | undefined) {
  return value ?? new Date(0).toISOString();
}

function fileSizeLabel(size: number | null | undefined) {
  if (!size || size <= 0) return "-";
  const mb = size / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(size / 1024))} KB`;
  if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function toLogStatusLabel(value: string | null | undefined) {
  if (value === "completed") return "已完成";
  if (value === "processing") return "分析中";
  if (value === "failed") return "已失败";
  return "未知";
}

function toRiskLabel(value: string | null | undefined) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  if (value === "low") return "低风险";
  return "未知";
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

export async function getAnalysisReportData(logId?: string): Promise<AnalysisReportData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_REPORT_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_REPORT_DATA;
  }

  const requestedLogId = String(logId ?? "").trim();
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
    return EMPTY_REPORT_DATA;
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
  const analysisByErrorId = new Map(analyses.map((item) => [item.log_error_id, item]));

  const typeCount = new Map<string, number>();
  for (const item of errors) {
    const key = toIssueDisplayName(item.error_type ?? "其他");
    typeCount.set(key, (typeCount.get(key) ?? 0) + 1);
  }

  const sortedTypes = Array.from(typeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PROBLEM_TYPE_ITEMS);

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

  const dominantRisk = analyses.map((item) => item.risk_level).sort((a, b) => toRiskWeight(b) - toRiskWeight(a))[0] ?? "low";
  const needsReview = dominantRisk === "high" || avgConfidence < 0.72;

  const detailRows = errors.map((error, index) => {
    const analysis = analysisByErrorId.get(error.id);
    return {
      id: analysis?.id ?? `pending-${error.id}`,
      incidentId: error.id,
      type: toIssueDisplayName(error.error_type ?? "未知异常"),
      riskLevel: toRiskValue(analysis?.risk_level),
      riskLabel: toRiskLabel(analysis?.risk_level),
      confidence: Number(analysis?.confidence ?? 0),
      cause: analysis?.cause ?? "分析结果生成中或暂不可用",
      suggestion: analysis?.repair_suggestion ?? "请稍后刷新页面，或进入人工复核。",
      snippet: error.raw_text ?? "",
      lineNumber: error.line_number ?? index + 1,
    } satisfies AnalysisReportDetailRow;
  });

  return {
    log: {
      id: logRecord.id,
      fileName: logRecord.file_name ?? "未命名日志",
      fileSizeLabel: fileSizeLabel(logRecord.file_size),
      status: logRecord.status ?? "unknown",
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
  };
}
