"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createLogUploadAction } from "@/app/logs/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import type { SelectableDetectionRule } from "@/lib/rules/db-rules";

function formatFileSize(size: number) {
  if (!size) return "0 KB";
  const mb = size / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.ceil(size / 1024))} KB`;
}

type UploadPageProps = {
  selectableRules: SelectableDetectionRule[];
  llmReady: boolean;
  llmProvider: string | null;
  llmStatusMessage: string;
};

export function UploadPage({ selectableRules, llmReady, llmProvider, llmStatusMessage }: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<"rule_only" | "model_only" | "hybrid">(
    llmReady ? "hybrid" : "rule_only",
  );
  const [submitIntent, setSubmitIntent] = useState<"single" | "triple_compare">("single");
  const selectedRuleIds = useMemo(
    () => selectableRules.filter((rule) => rule.enabled).map((rule) => rule.id),
    [selectableRules],
  );

  const effectiveAnalysisMode: "rule_only" | "model_only" | "hybrid" = llmReady ? analysisMode : "rule_only";
  const effectiveSubmitIntent: "single" | "triple_compare" = llmReady ? submitIntent : "single";

  const totalSizeText = useMemo(() => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(total);
  }, [files]);

  function syncFiles(nextFiles: File[]) {
    const selected = nextFiles.slice(0, 1);
    setFiles(selected);

    if (!inputRef.current) return;

    if (selected.length === 0) {
      inputRef.current.value = "";
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(selected[0]);
    inputRef.current.files = transfer.files;
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    syncFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    syncFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function handleRemoveSelectedFile() {
    syncFiles([]);
  }

  return (
    <form action={createLogUploadAction} className="mx-auto w-full max-w-6xl">
      <input type="hidden" name="sourceType" value="custom" />
      <input type="hidden" name="analysisMode" value={effectiveAnalysisMode} />
      <input type="hidden" name="ruleSelectionProvided" value="1" />
      {selectedRuleIds.map((ruleId) => (
        <input key={ruleId} type="hidden" name="selectedRuleIds" value={ruleId} />
      ))}

      <section className="mb-10">
        <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">上传日志文件</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-[#5F6B7A]">
          支持 `.log`、`.txt`、`.json`、`.csv` 等常见格式。提交后会直接走真实分析链路，并打开本次文件的分析详情。
        </p>
      </section>

      <div className="glass-panel rounded-3xl border border-white/30 p-1 shadow-[0_20px_60px_rgba(31,78,121,0.12)]">
        <div
          className={`flex min-h-[340px] w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed p-8 text-center transition-colors ${
            dragActive ? "border-[#1F4E79]/60 bg-white/20" : "border-[#1F4E79]/30"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#1F4E79]/20 bg-[#E9EDF3]">
            <span className="material-symbols-outlined text-4xl text-[#1F4E79]">cloud_upload</span>
          </div>
          <h3 className="mb-2 text-2xl font-bold text-[#1F2A37]">点击或拖拽文件至此上传</h3>
          <p className="mb-8 text-xs uppercase tracking-widest text-[#5F6B7A]">Maximum file size: 500MB</p>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {[".LOG", ".TXT", ".JSON", ".CSV"].map((ext) => (
              <span
                key={ext}
                className="rounded-full border border-[#1F4E79]/20 bg-[#E9EDF3] px-4 py-1.5 text-xs font-label text-[#5F6B7A]"
              >
                {ext}
              </span>
            ))}
          </div>

          <input
            ref={inputRef}
            id="file-upload"
            name="logFile"
            type="file"
            className="hidden"
            accept=".log,.txt,.json,.csv,.out,text/plain,application/json,text/csv"
            onChange={handleFilesSelected}
          />

          <label
            htmlFor="file-upload"
            className="inline-block cursor-pointer rounded-xl bg-[#1F4E79] px-8 py-3 font-label font-bold text-white transition hover:bg-[#7A4A1B]"
          >
            选择文件
          </label>
        </div>
      </div>

      <section className="mt-6 space-y-3">
        <h4 className="px-1 text-xs font-label font-bold uppercase tracking-widest text-[#5F6B7A]">分析模式</h4>
        <div className={`rounded-2xl border p-4 ${llmReady ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/70"}`}>
          <p className="text-sm font-semibold text-[#1F2A37]">
            模型状态：{llmReady ? "已就绪" : "未就绪"}
            {llmProvider ? `（${llmProvider}）` : ""}
          </p>
          <p className="mt-1 text-xs leading-6 text-[#5F6B7A]">{llmStatusMessage}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className={`glass-panel flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition ${analysisMode === "rule_only" ? "border-[#1F4E79]/60 bg-[#E9EDF3]" : "border-white/30"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1F2A37]">Rule Only</span>
              <input
                type="radio"
                name="analysisModeSelector"
                value="rule_only"
                checked={effectiveAnalysisMode === "rule_only"}
                onChange={() => setAnalysisMode("rule_only")}
              />
            </div>
            <p className="text-xs leading-6 text-[#5F6B7A]">仅使用规则引擎，速度快、成本低，适合快速初筛。</p>
          </label>
          <label className={`glass-panel flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition ${analysisMode === "model_only" ? "border-[#1F4E79]/60 bg-[#E9EDF3]" : "border-white/30"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1F2A37]">Model Only</span>
              <input
                type="radio"
                name="analysisModeSelector"
                value="model_only"
                checked={effectiveAnalysisMode === "model_only"}
                disabled={!llmReady}
                onChange={() => setAnalysisMode("model_only")}
              />
            </div>
            <p className="text-xs leading-6 text-[#5F6B7A]">仅使用模型分析，不启用 RAG，适合评估纯模型能力。</p>
          </label>
          <label className={`glass-panel flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition ${analysisMode === "hybrid" ? "border-[#1F4E79]/60 bg-[#E9EDF3]" : "border-white/30"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#1F2A37]">Hybrid（默认）</span>
              <input
                type="radio"
                name="analysisModeSelector"
                value="hybrid"
                checked={effectiveAnalysisMode === "hybrid"}
                disabled={!llmReady}
                onChange={() => setAnalysisMode("hybrid")}
              />
            </div>
            <p className="text-xs leading-6 text-[#5F6B7A]">规则 + RAG + 模型协同，兼顾准确性、覆盖率与成本。</p>
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-white/30 bg-white/45 p-4">
          <h4 className="px-1 text-xs font-label font-bold uppercase tracking-widest text-[#5F6B7A]">
            规则启用状态
          </h4>
          <p className="mt-2 px-1 text-sm leading-7 text-[#5F6B7A]">
            本页不提供规则启用/禁用操作。当前分析会自动使用系统设置中已启用的规则与知识条目。
          </p>
          <p className="mt-2 px-1 text-xs text-[#7B8898]">
            当前系统启用：{selectedRuleIds.length} / {selectableRules.length} 条。
          </p>
        </div>

        <h4 className="px-1 text-xs font-label font-bold uppercase tracking-widest text-[#5F6B7A]">已选择的文件</h4>
        {files.length === 0 ? (
          <p className="px-1 py-3 text-sm text-[#5F6B7A]">暂无文件，请先上传日志后再开始分析。</p>
        ) : (
          files.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="glass-panel flex items-center gap-4 rounded-2xl border border-white/30 p-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#1F4E79]/20 bg-[#E9EDF3]">
                <span className="material-symbols-outlined text-[#1F4E79]">description</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate font-medium text-[#1F2A37]">{file.name}</span>
                  <span className="whitespace-nowrap text-xs text-[#5F6B7A]">{formatFileSize(file.size)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#DCE4EE]">
                  <div className="h-full w-full bg-[#1F4E79]" />
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveSelectedFile}
                className="rounded-full p-2 text-[#5F6B7A] transition hover:bg-[#E9EDF3] hover:text-[#1F2A37]"
                aria-label="移除已选文件"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ))
        )}
      </section>

      <footer className="mt-10 flex flex-col items-start justify-end gap-4 md:flex-row md:items-center md:gap-6">
        <span className="flex items-center gap-2 text-sm text-[#5F6B7A]">
          <span className="material-symbols-outlined text-sm">info</span>
          分析完成后结果将自动保存至历史记录，当前文件总大小：{totalSizeText}
        </span>
        <SubmitButton
          idleText="上传并开始分析"
          pendingText="正在上传并生成分析结果..."
          name="submitIntent"
          value="single"
          onClick={() => setSubmitIntent("single")}
          className="flex items-center gap-3 rounded-xl bg-white px-8 py-4 font-extrabold text-black shadow-[0_10px_40px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-95"
        />
        <SubmitButton
          idleText="一键三模式对比"
          pendingText="正在连续运行 Rule/Model/Hybrid..."
          name="submitIntent"
          value="triple_compare"
          disabled={!llmReady}
          onClick={() => setSubmitIntent("triple_compare")}
          className={`flex items-center gap-3 rounded-xl border px-8 py-4 font-extrabold transition-all ${
            llmReady
              ? "border-[#1F4E79]/30 bg-[#E9EDF3] text-[#1F2A37] shadow-[0_10px_24px_rgba(31,78,121,0.12)] hover:scale-[1.02] active:scale-95"
              : "cursor-not-allowed border-[#C8D1DD] bg-[#EDF1F6] text-[#98A4B3]"
          }`}
        />
      </footer>

      <UploadPendingOverlay submitIntent={effectiveSubmitIntent} />
    </form>
  );
}

function UploadPendingOverlay({ submitIntent }: { submitIntent: "single" | "triple_compare" }) {
  const { pending } = useFormStatus();
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (!pending) return;

    const phases =
      submitIntent === "triple_compare"
        ? [
            "上传日志中",
            "Rule Only 分析中",
            "Model Only 分析中",
            "Hybrid 分析中",
            "汇总对比结果中",
          ]
        : ["上传日志中", "规则检测中", "模型推理中", "写入结果中"];

    const timer = window.setInterval(() => {
      setPhaseIndex((phasePrev) => {
        if (phasePrev >= phases.length - 1) {
          return phasePrev;
        }

        return phasePrev + 1;
      });
    }, 420);

    return () => window.clearInterval(timer);
  }, [pending, submitIntent]);

  if (!pending) {
    return null;
  }

  const title = submitIntent === "triple_compare" ? "正在执行三模式对比" : "正在分析日志";
  const description =
    submitIntent === "triple_compare"
      ? "系统会依次运行 Rule Only、Model Only、Hybrid，并自动生成可对比结果。"
      : "系统正在读取文件、执行分析链路并生成结构化结论。";
  const phases =
    submitIntent === "triple_compare"
      ? [
          "上传日志中",
          "Rule Only 分析中",
          "Model Only 分析中",
          "Hybrid 分析中",
          "汇总对比结果中",
        ]
      : ["上传日志中", "规则检测中", "模型推理中", "写入结果中"];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1F2A37]/40 backdrop-blur-[2px]">
      <div className="glass-panel w-[min(92vw,560px)] rounded-3xl border border-[#DCE4EE] bg-[#FFFFFF] p-8 shadow-[0_24px_80px_rgba(31,42,55,0.28)]">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute h-14 w-14 animate-spin rounded-full border-4 border-[#1F4E79]/20 border-t-[#1F4E79]" />
            <span className="absolute h-9 w-9 animate-spin rounded-full border-4 border-[#7A4A1B]/25 border-b-[#7A4A1B] [animation-direction:reverse] [animation-duration:1.2s]" />
          </div>
          <div>
            <p className="font-headline text-2xl font-extrabold text-[#1F2A37]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[#5F6B7A]">{description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-center text-xs font-medium text-[#5F6B7A]">
            {phases[Math.min(phaseIndex, phases.length - 1)]}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#1F4E79]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#4E7FAA] [animation-delay:120ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#7A4A1B] [animation-delay:240ms]" />
          </div>
          <p className="text-center text-xs text-[#7B8898]">请稍候，分析期间请勿关闭页面。</p>
        </div>
      </div>
    </div>
  );
}
