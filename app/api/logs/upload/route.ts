import { NextResponse } from "next/server";
import { uploadAndAnalyzeLog } from "@/lib/logs/upload-service";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeAnalysisMode(value: string): "rule_only" | "model_only" | "hybrid" {
  if (value === "rule_only" || value === "model_only" || value === "hybrid") {
    return value;
  }

  return "hybrid";
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in before uploading logs." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("logFile");
  const sourceType = getTrimmedValue(formData, "sourceType") || "custom";
  const analysisMode = normalizeAnalysisMode(getTrimmedValue(formData, "analysisMode"));
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
    return NextResponse.json({ error: "Please choose a log file first." }, { status: 400 });
  }

  try {
    const { logBucket } = getSupabaseEnv();
    const result = await uploadAndAnalyzeLog({
      supabase,
      user,
      file,
      sourceType,
      analysisMode,
      selectedRuleIds: selectedDetectionRuleIdsForRun,
      selectedKnowledgeIds: selectedKnowledgeIdsForRun,
      logBucket,
    });

    return NextResponse.json({
      ok: true,
      logId: result.logId,
      redirectTo: `/dashboard/analyses?logId=${result.logId}`,
      fileName: result.fileName,
      analysisMode: result.analysisMode,
      incidentsCount: result.incidentsCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Log upload failed." },
      { status: 400 },
    );
  }
}
