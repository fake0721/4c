import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

export type WorkbenchMetricSet = {
  totalLogs: number;
  totalIssues: number;
  highRisk: number;
  pendingReviews: number;
};

export type WorkbenchTrendPoint = {
  day: string;
  total: number;
  high: number;
};

export type WorkbenchTypeBreakdownItem = {
  label: string;
  count: number;
  percent: number;
};

export type WorkbenchRecentLog = {
  id: string;
  fileName: string | null;
  createdAt: string | null;
  statusLabel: string;
};

export type WorkbenchTodo = {
  id: string;
  title: string;
  description: string;
  sourceLog: string;
  updatedAt: string;
};

export type WorkbenchData = {
  metrics: WorkbenchMetricSet;
  trend: WorkbenchTrendPoint[];
  typeBreakdown: WorkbenchTypeBreakdownItem[];
  recentLogs: WorkbenchRecentLog[];
  pendingTodos: WorkbenchTodo[];
  pendingReviewCount: number;
};

export type DashboardShellData = {
  userEmail: string;
  teamName: string | null;
  avatarUrl: string | null;
  pendingReviewCount: number;
};

const EMPTY_WORKBENCH_DATA: WorkbenchData = {
  metrics: {
    totalLogs: 0,
    totalIssues: 0,
    highRisk: 0,
    pendingReviews: 0,
  },
  trend: Array.from({ length: 7 }).map((_, index) => ({
    day: `${index + 1}`,
    total: 0,
    high: 0,
  })),
  typeBreakdown: [
    { label: "数据库异常", count: 0, percent: 0 },
    { label: "网络异常", count: 0, percent: 0 },
    { label: "权限异常", count: 0, percent: 0 },
    { label: "配置异常", count: 0, percent: 0 },
    { label: "服务异常", count: 0, percent: 0 },
  ],
  recentLogs: [],
  pendingTodos: [],
  pendingReviewCount: 0,
};

function asIsoDate(value: string | null | undefined) {
  return value ?? new Date(0).toISOString();
}

function toLogStatusLabel(value: string | null | undefined) {
  if (value === "completed") return "已完成";
  if (value === "processing") return "分析中";
  if (value === "failed") return "已失败";
  return "未知";
}

function toIssueDisplayName(value: string | null | undefined) {
  return toIssueTypeDisplayName(value);
}

function appendVersionToAvatar(avatarUrl: string | null | undefined, updatedAt: string | null | undefined) {
  const url = String(avatarUrl ?? "").trim();
  if (!url) return null;
  const version = String(updatedAt ?? "").trim();
  if (!version) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
}

export async function getDashboardShellData(): Promise<DashboardShellData> {
  if (!hasSupabaseEnv()) {
    return {
      userEmail: "未登录",
      teamName: null,
      avatarUrl: null,
      pendingReviewCount: 0,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userEmail: "未登录",
      teamName: null,
      avatarUrl: null,
      pendingReviewCount: 0,
    };
  }

  const [{ data: profile }, { count: pendingReviewCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("team_name, avatar_url, updated_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("review_cases")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("review_status", "pending"),
  ]);

  return {
    userEmail: user.email ?? "未登录",
    teamName: profile?.team_name ?? null,
    avatarUrl: appendVersionToAvatar(profile?.avatar_url, profile?.updated_at),
    pendingReviewCount: pendingReviewCount ?? 0,
  };
}

export async function getWorkbenchData(): Promise<WorkbenchData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_WORKBENCH_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_WORKBENCH_DATA;
  }

  const [{ count: totalLogs }, { count: totalIssues }, { count: pendingReviews }, { count: highRisk }, { data: pendingCases }] =
    await Promise.all([
      supabase.from("logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("log_errors").select("id", { count: "exact", head: true }).eq("user_id", user.id),
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
    supabase.from("log_errors").select("error_type").eq("user_id", user.id).limit(5000),
  ]);

  const pendingErrorIds = (pendingCases ?? []).map((item) => item.log_error_id);
  const { data: pendingErrors } = pendingErrorIds.length
    ? await supabase
        .from("log_errors")
        .select("id, log_id, error_type, raw_text")
        .eq("user_id", user.id)
        .in("id", pendingErrorIds)
        .limit(50)
    : {
        data: [] as Array<{
          id: string;
          log_id: string;
          error_type: string | null;
          raw_text: string | null;
        }>,
      };

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
    const dayAnalyses = (analyses ?? []).filter((item) => String(item.created_at ?? "").startsWith(yyyyMmDd));

    return {
      day: `${day.getMonth() + 1}/${day.getDate()}`,
      total: dayAnalyses.length,
      high: dayAnalyses.filter((item) => item.risk_level === "high").length,
    };
  });

  const errorTypeCounts = new Map<string, number>();
  for (const item of errors ?? []) {
    const key = toIssueDisplayName(item.error_type ?? "其他");
    errorTypeCounts.set(key, (errorTypeCounts.get(key) ?? 0) + 1);
  }

  const issueTotal = totalIssues ?? 0;
  const typeBreakdown = Array.from(errorTypeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({
      label,
      count,
      percent: issueTotal > 0 ? Math.max(1, Math.round((count / issueTotal) * 100)) : 0,
    }));

  return {
    metrics: {
      totalLogs: totalLogs ?? 0,
      totalIssues: totalIssues ?? 0,
      highRisk: highRisk ?? 0,
      pendingReviews: pendingReviews ?? 0,
    },
    trend,
    typeBreakdown: typeBreakdown.length > 0 ? typeBreakdown : EMPTY_WORKBENCH_DATA.typeBreakdown,
    recentLogs: (logs ?? []).map((item) => ({
      id: item.id,
      fileName: item.file_name,
      createdAt: item.uploaded_at,
      statusLabel: toLogStatusLabel(item.status),
    })),
    pendingTodos,
    pendingReviewCount: pendingReviews ?? 0,
  };
}
