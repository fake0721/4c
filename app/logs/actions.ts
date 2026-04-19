"use server";

import { revalidatePath } from "next/cache";
import { uploadAndAnalyzeLog } from "@/lib/logs/upload-service";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { encodedRedirect } from "@/lib/utils";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeAnalysisMode(value: string): "rule_only" | "model_only" | "hybrid" {
  if (value === "rule_only" || value === "model_only" || value === "hybrid") {
    return value;
  }

  return "hybrid";
}

export async function createLogUploadAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/upload", "请先配置 Supabase 环境变量。");
  }

  const file = formData.get("logFile");
  const sourceType = getTrimmedValue(formData, "sourceType") || "custom";
  const analysisMode = normalizeAnalysisMode(getTrimmedValue(formData, "analysisMode"));
  const submitIntent = getTrimmedValue(formData, "submitIntent") || "single";
  const ruleSelectionProvided = getTrimmedValue(formData, "ruleSelectionProvided") === "1";
  const selectedRuleIds = formData
    .getAll("selectedRuleIds")
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
  const selectedDetectionRuleIds = selectedRuleIds
    .filter((item) => item.startsWith("rule:"))
    .map((item) => item.slice("rule:".length))
    .filter(Boolean);
  const selectedKnowledgeIds = selectedRuleIds
    .filter((item) => item.startsWith("knowledge:"))
    .map((item) => item.slice("knowledge:".length))
    .filter(Boolean);
  const selectedDetectionRuleIdsForRun = ruleSelectionProvided ? selectedDetectionRuleIds : undefined;
  const selectedKnowledgeIdsForRun = ruleSelectionProvided ? selectedKnowledgeIds : undefined;

  if (!(file instanceof File) || file.size === 0) {
    return encodedRedirect("error", "/upload", "请先选择日志文件。");
  }

  const { logBucket } = getSupabaseEnv();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/login", "请先登录后再上传日志。");
  }

  if (submitIntent === "triple_compare") {
    const runModes: Array<"rule_only" | "model_only" | "hybrid"> = ["rule_only", "model_only", "hybrid"];
    const results: Array<Awaited<ReturnType<typeof uploadAndAnalyzeLog>>> = [];

    try {
      for (const mode of runModes) {
        const result = await uploadAndAnalyzeLog({
          supabase,
          user,
          file,
          sourceType,
          analysisMode: mode,
          selectedRuleIds: selectedDetectionRuleIdsForRun,
          selectedKnowledgeIds: selectedKnowledgeIdsForRun,
          logBucket,
        });
        results.push(result);
      }
    } catch (error) {
      const partial = results.length > 0 ? `（已完成 ${results.length}/3）` : "";
      return encodedRedirect(
        "error",
        "/upload",
        `${error instanceof Error ? error.message : "三模式对比执行失败。"}${partial}`,
      );
    }

    const totalIncidents = results.reduce((sum, item) => sum + item.incidentsCount, 0);
    return encodedRedirect(
      "success",
      "/dashboard/performance",
      `已完成同文件三模式对比（Rule Only / Model Only / Hybrid），共识别 ${totalIncidents} 个候选问题。`,
      { days: "7" },
    );
  }

  let result: Awaited<ReturnType<typeof uploadAndAnalyzeLog>>;

  try {
    result = await uploadAndAnalyzeLog({
      supabase,
      user,
      file,
      sourceType,
      analysisMode,
      selectedRuleIds: selectedDetectionRuleIdsForRun,
      selectedKnowledgeIds: selectedKnowledgeIdsForRun,
      logBucket,
    });
  } catch (error) {
    return encodedRedirect(
      "error",
      "/upload",
      error instanceof Error ? error.message : "日志上传失败，请稍后重试。",
    );
  }

  return encodedRedirect(
    "success",
    `/dashboard/analyses?logId=${result.logId}`,
    `已成功上传 ${result.fileName}，识别到 ${result.incidentsCount} 个候选问题。`,
  );
}

export async function updateLogMetadataAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/dashboard/tasks", "Supabase is not configured.");
  }

  const logId = getTrimmedValue(formData, "logId");
  const fileName = getTrimmedValue(formData, "fileName");
  const sourceType = getTrimmedValue(formData, "sourceType") || "custom";

  if (!logId || !fileName) {
    return encodedRedirect("error", "/dashboard/tasks", "请填写完整的日志信息。");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "请先登录后再管理日志。");
  }

  const { error } = await supabase
    .from("logs")
    .update({
      file_name: fileName,
      source_type: sourceType,
    })
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) {
    return encodedRedirect("error", "/dashboard/tasks", error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/logs/${logId}`);

  return encodedRedirect("success", "/dashboard/tasks", "日志信息已更新。");
}

export async function deleteLogAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/dashboard/tasks", "Supabase is not configured.");
  }

  const logId = getTrimmedValue(formData, "logId");
  const storagePath = getTrimmedValue(formData, "storagePath");

  if (!logId) {
    return encodedRedirect("error", "/dashboard/tasks", "未找到要删除的日志。");
  }

  const { logBucket } = getSupabaseEnv();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "请先登录后再管理日志。");
  }

  const { data: deletedLog, error } = await supabase
    .from("logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !deletedLog) {
    return encodedRedirect("error", "/dashboard/tasks", error?.message ?? "日志删除未生效，请刷新后重试。");
  }

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(logBucket)
      .remove([storagePath]);

    if (storageError) {
      return encodedRedirect("success", "/dashboard/tasks", "日志已删除，但原文件清理失败。");
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/incidents");
  revalidatePath("/dashboard/high-risk");
  revalidatePath("/dashboard/analyses");

  return encodedRedirect("success", "/dashboard/tasks", "日志已删除。");
}
