import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type AnalysisRow = {
  id: string;
  fileName: string | null;
  createdAt: string;
  sizeLabel: string;
  storagePath: string;
  status: string | null;
  statusLabel: string;
  issueCount: number;
  riskLabel: string;
};

export type AnalysesPageData = {
  rows: AnalysisRow[];
  total: number;
  pendingReviewCount: number;
};

const EMPTY_ANALYSES_DATA: AnalysesPageData = {
  rows: [],
  total: 0,
  pendingReviewCount: 0,
};

function asIsoDate(value: string | null | undefined) {
  return value ?? new Date(0).toISOString();
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
  return "低风险";
}

export async function getAnalysesPageData(): Promise<AnalysesPageData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_ANALYSES_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_ANALYSES_DATA;
  }

  const [logsResult, errorsResult, analysesResult, pendingReviewsResult] = await Promise.all([
    supabase
      .from("logs")
      .select("id, file_name, file_size, status, uploaded_at, storage_path")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false })
      .limit(100),
    supabase.from("log_errors").select("log_id, id").eq("user_id", user.id).limit(1000),
    supabase.from("analysis_results").select("log_id, risk_level").eq("user_id", user.id).limit(1000),
    supabase
      .from("review_cases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("review_status", "pending"),
  ]);

  const issueCountByLog = new Map<string, number>();
  for (const item of errorsResult.data ?? []) {
    issueCountByLog.set(item.log_id, (issueCountByLog.get(item.log_id) ?? 0) + 1);
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

  const rows: AnalysisRow[] = (logsResult.data ?? []).map((item) => ({
    id: item.id,
    fileName: item.file_name,
    createdAt: asIsoDate(item.uploaded_at),
    sizeLabel: fileSizeLabel(item.file_size),
    storagePath: item.storage_path ?? "",
    status: item.status,
    statusLabel: toLogStatusLabel(item.status),
    issueCount: issueCountByLog.get(item.id) ?? 0,
    riskLabel: toRiskLabel(riskByLog.get(item.id)),
  }));

  return {
    rows,
    total: rows.length,
    pendingReviewCount: pendingReviewsResult.count ?? 0,
  };
}
