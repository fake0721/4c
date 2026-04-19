import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LogDetail } from "@/components/dashboard/log-detail";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

const PREVIEW_LINE_LIMIT = 40;

type LogDetailPageProps = {
  params: {
    logId: string;
  };
};

export default async function LogDetailPage({ params }: LogDetailPageProps) {
  if (!hasSupabaseEnv()) {
    redirect("/dashboard?status=error&message=Supabase%20is%20not%20configured.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: logRecord, error: logError } = await supabase
    .from("logs")
    .select(
      "id, file_name, file_type, source_type, analysis_mode, status, storage_path, file_size, line_count, uploaded_at, completed_at",
    )
    .eq("id", params.logId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (logError) {
    redirect(
      `/dashboard/tasks?status=error&message=${encodeURIComponent(logError.message)}`,
    );
  }

  if (!logRecord) {
    notFound();
  }

  const [errorsResult, analysesResult, preview] = await Promise.all([
    supabase
      .from("log_errors")
      .select("id, raw_text, error_type, detected_by, line_number, created_at")
      .eq("log_id", logRecord.id)
      .eq("user_id", user.id)
      .order("line_number", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("analysis_results")
      .select(
        "id, log_error_id, cause, risk_level, confidence, repair_suggestion, model_name, analysis_mode, created_at",
      )
      .eq("log_id", logRecord.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    readLogPreview(logRecord.storage_path),
  ]);

  if (errorsResult.error) {
    redirect(
      `/dashboard/tasks?status=error&message=${encodeURIComponent(errorsResult.error.message)}`,
    );
  }

  if (analysesResult.error) {
    redirect(
      `/dashboard/tasks?status=error&message=${encodeURIComponent(analysesResult.error.message)}`,
    );
  }

  const errors = (errorsResult.data ?? []).map((item) => ({
    id: item.id,
    rawText: item.raw_text ?? "",
    errorType: item.error_type ?? "unknown",
    detectedBy: item.detected_by ?? "rule",
    lineNumber: item.line_number ?? 0,
    createdAt: item.created_at ?? "",
  }));

  const analyses = (analysesResult.data ?? []).map((item) => ({
    id: item.id,
    logErrorId: item.log_error_id,
    cause: item.cause ?? "暂无分析结论",
    riskLevel: item.risk_level ?? "uncertain",
    confidence: normalizeConfidence(item.confidence),
    repairSuggestion: item.repair_suggestion ?? "暂无处理建议",
    modelName: item.model_name ?? "unknown",
    analysisMode: item.analysis_mode ?? logRecord.analysis_mode ?? "hybrid",
    createdAt: item.created_at ?? "",
  }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(91,143,185,0.16),_transparent_30%),linear-gradient(180deg,_#f3f5f8_0%,_#ffffff_58%,_#eef2f7_100%)] px-4 py-4 text-[#1F2A37] md:px-6 md:py-6">
      <section className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#dce4ee] bg-white px-5 py-4 shadow-[0_16px_46px_rgba(31,42,55,0.12)]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#5b8fb9]">
              Live Detail
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#1f2a37]">
              当前日志分析详情
            </h1>
            <p className="mt-1 text-sm text-[#5f6b7a]">
              该页面已直接读取真实上传结果，不再展示静态占位报告。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="rounded-full border border-[#c4d2e3] bg-white px-4 py-2 text-sm font-medium text-[#314254] transition hover:border-[#8ea8c6] hover:bg-[#f4f8fc]"
            >
              再传一份日志
            </Link>
            <Link
              href="/dashboard/tasks"
              className="rounded-full bg-[#1f4e79] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#173d61]"
            >
              返回历史列表
            </Link>
          </div>
        </div>

        <LogDetail
          log={{
            id: logRecord.id,
            fileName: logRecord.file_name ?? "未命名日志",
            fileType: logRecord.file_type ?? "unknown",
            sourceType: logRecord.source_type ?? "custom",
            analysisMode: logRecord.analysis_mode ?? "hybrid",
            status: logRecord.status ?? "processing",
            storagePath: logRecord.storage_path ?? "",
            fileSize: logRecord.file_size ?? 0,
            lineCount: logRecord.line_count ?? 0,
            uploadedAt: logRecord.uploaded_at ?? "",
            completedAt: logRecord.completed_at,
          }}
          errors={errors}
          analyses={analyses}
          preview={preview}
        />
      </section>
    </main>
  );
}

async function readLogPreview(storagePath: string | null) {
  if (!storagePath) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { logBucket } = getSupabaseEnv();
    const { data, error } = await supabase.storage.from(logBucket).download(storagePath);

    if (error || !data) {
      return null;
    }

    const text = await data.text();
    const lines = text.split(/\r\n|\r|\n/);

    return {
      text: lines.slice(0, PREVIEW_LINE_LIMIT).join("\n"),
      truncated: lines.length > PREVIEW_LINE_LIMIT,
    };
  } catch {
    return null;
  }
}

function normalizeConfidence(value: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}
