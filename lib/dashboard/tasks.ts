import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type TaskHistoryRow = {
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

export type TaskTrendItem = {
  label: string;
  count: number;
  heightPercent: number;
};

export type TasksOverview = {
  knowledgeTemplateCount: number;
  trend: TaskTrendItem[];
  totalStorageGb: string;
  monthTaskCount: number;
};

export type TasksPageData = {
  rows: TaskHistoryRow[];
  total: number;
  pendingReviewCount: number;
  overview: TasksOverview;
};

const EMPTY_TASKS_DATA: TasksPageData = {
  rows: [],
  total: 0,
  pendingReviewCount: 0,
  overview: {
    knowledgeTemplateCount: 0,
    trend: [],
    totalStorageGb: "0.0 GB",
    monthTaskCount: 0,
  },
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
  return "未知";
}

export async function getTasksPageData(): Promise<TasksPageData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_TASKS_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_TASKS_DATA;
  }

  const [logsResult, errorsResult, analysesResult, logsStatsResult, knowledgeCountResult, pendingReviewResult] =
    await Promise.all([
      supabase
        .from("logs")
        .select("id, file_name, file_size, status, uploaded_at, storage_path")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(100),
      supabase.from("log_errors").select("log_id, id").eq("user_id", user.id).limit(1000),
      supabase.from("analysis_results").select("log_id, risk_level").eq("user_id", user.id).limit(1000),
      supabase
        .from("logs")
        .select("file_size, uploaded_at")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
        .limit(5000),
      supabase.from("knowledge_base").select("id", { count: "exact", head: true }),
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
    const current = riskByLog.get(item.log_id);
    if (item.risk_level === "high" || current === "high") {
      riskByLog.set(item.log_id, "high");
    } else if (item.risk_level === "medium" || current === "medium") {
      riskByLog.set(item.log_id, "medium");
    } else if (!current) {
      riskByLog.set(item.log_id, item.risk_level ?? "low");
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
    const count = statLogs.filter((item) => String(item.uploaded_at ?? "").startsWith(key)).length;

    return {
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      count,
    };
  });

  const maxTrendCount = Math.max(...trendDays.map((item) => item.count), 1);

  return {
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
    pendingReviewCount: pendingReviewResult.count ?? 0,
    overview: {
      knowledgeTemplateCount: knowledgeCountResult.count ?? 0,
      trend: trendDays.map((item) => ({
        label: item.label,
        count: item.count,
        heightPercent: Math.max(12, Math.round((item.count / maxTrendCount) * 100)),
      })),
      totalStorageGb: totalStorageBytes > 0 ? `${(totalStorageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB` : "0.0 GB",
      monthTaskCount,
    },
  };
}
