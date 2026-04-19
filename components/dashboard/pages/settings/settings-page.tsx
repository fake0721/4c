"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ExportTemplate, SettingsPageData, SystemSettings } from "@/lib/dashboard/settings";

type SettingsPageProps = {
  data: SettingsPageData;
};

export function SettingsPage({ data }: SettingsPageProps) {
  const [settings, setSettings] = useState<SystemSettings>(data.settings);
  const [templates, setTemplates] = useState<ExportTemplate[]>(data.exportTemplates);
  const [activeTemplateId, setActiveTemplateId] = useState(data.activeExportTemplateId);
  const [saving, setSaving] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const customTemplateCount = useMemo(() => templates.filter((item) => !item.builtin).length, [templates]);

  function applyRetention(retentionDays: 30 | 90 | 365) {
    setSettings((current) => ({ ...current, retentionDays }));
  }

  function updateBoolean<K extends "autoCleanup" | "realtimePush">(key: K) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  }

  function updateNumber<K extends "temperature" | "maxTokens" | "concurrency">(key: K, value: number) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateEngine(value: string) {
    setSettings((current) => ({ ...current, engine: value }));
  }

  async function saveSettings() {
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/inner-data", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "update-system-settings", systemSettings: settings }),
      });
      const payload = (await response.json().catch(() => null)) as { settings?: SystemSettings; error?: string; ok?: boolean } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "系统设置保存失败，请稍后重试。");
      }
      if (payload.settings) {
        setSettings(payload.settings);
      }
      window.alert("系统设置已保存。");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "系统设置保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function saveTemplates(nextTemplates: ExportTemplate[], nextActiveTemplateId: string) {
    const response = await fetch("/api/inner-data", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "update-export-templates",
        exportTemplates: nextTemplates.filter((item) => !item.builtin),
        activeExportTemplateId: nextActiveTemplateId,
      }),
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      exportTemplates?: ExportTemplate[];
      activeExportTemplateId?: string;
    } | null;
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "导出模板更新失败。");
    }
    setTemplates(payload.exportTemplates ?? nextTemplates);
    setActiveTemplateId(payload.activeExportTemplateId ?? nextActiveTemplateId);
  }

  async function handleTemplatePick(templateId: string) {
    if (templateBusy || templateId === activeTemplateId) return;
    setTemplateBusy(true);
    try {
      await saveTemplates(templates, templateId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "模板选择失败。");
    } finally {
      setTemplateBusy(false);
    }
  }

  async function handleCreateTemplate() {
    if (templateBusy) return;
    const name = window.prompt("请输入模板名称", "自定义导出模板");
    if (!name || !name.trim()) return;
    const format = window.prompt("请输入模板格式", "Custom")?.trim() || "Custom";
    const idBase = normalizeTemplateId(name) || "custom-template";
    let nextId = idBase;
    let seq = 2;
    const usedIds = new Set(templates.map((item) => item.id));
    while (usedIds.has(nextId)) {
      nextId = `${idBase}-${seq}`;
      seq += 1;
    }

    const nextTemplates = templates.concat({
      id: nextId,
      name: name.trim(),
      format,
      description: "用户创建的自定义模板",
      usage: "custom",
      builtin: false,
    });

    setTemplateBusy(true);
    try {
      await saveTemplates(nextTemplates, nextId);
      window.alert("自定义模板已创建。");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "模板创建失败。");
    } finally {
      setTemplateBusy(false);
    }
  }

  async function handleTemplateUpload(file: File) {
    setTemplateBusy(true);
    try {
      const formData = new FormData();
      formData.append("action", "upload-export-template-file");
      formData.append("file", file);
      formData.append("templateName", file.name.replace(/\.[^.]+$/, "") || "上传模板");
      formData.append("templateDescription", "用户上传模板文件");
      formData.append("templateUsage", "upload");

      const response = await fetch("/api/inner-data", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        exportTemplates?: ExportTemplate[];
        activeExportTemplateId?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "模板上传失败。");
      }

      setTemplates(payload.exportTemplates ?? templates);
      setActiveTemplateId(payload.activeExportTemplateId ?? activeTemplateId);
      window.alert("模板文件已上传。");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "模板上传失败。");
    } finally {
      setTemplateBusy(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
    }
  }

  async function handleTemplateDownload(template: ExportTemplate) {
    if (templateBusy || !template.id || !template.filePath) {
      return;
    }

    setTemplateBusy(true);
    try {
      const response = await fetch("/api/inner-data", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "download-export-template-file", templateId: template.id }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "模板下载失败，请稍后重试。");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get("content-disposition") || "";
      const matched = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const fileName = matched?.[1]
        ? decodeURIComponent(matched[1])
        : (template.fileName || `${template.name || "template"}.bin`);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "模板下载失败，请稍后重试。");
    } finally {
      setTemplateBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl text-[#1F2A37]">
      <header className="mb-12">
        <h1 className="mb-2 font-headline text-5xl font-extrabold tracking-tight">系统设置</h1>
        <p className="text-lg text-[#5F6B7A]">由用户自行配置系统参数与导出策略，该页面不直接修改规则沉淀内容。</p>
      </header>

      <section className="glass-panel sticky top-20 z-20 mb-10 rounded-2xl border border-[#DCE4EE] p-4 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">系统管理自由切换</p>
          <span className="text-[10px] text-[#97A4B2]">在三个页面之间快速跳转</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link href="/dashboard/rules" className="rounded-xl border border-[#DCE4EE] bg-white/25 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]">
            规则配置
          </Link>
          <Link href="/dashboard/performance" className="rounded-xl border border-[#DCE4EE] bg-white/25 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]">
            性能分析
          </Link>
          <button type="button" className="rounded-xl border border-[#1F4E79]/30 bg-gradient-to-r from-[#1F4E79]/20 to-transparent px-4 py-3 text-sm font-bold text-[#1F4E79]">
            系统设置（当前）
          </button>
        </div>
      </section>

      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#3A6A9A]/20 bg-[#3A6A9A]/10 px-4 py-2 text-[10px] font-label uppercase tracking-widest text-[#3A6A9A]">
        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>tune</span>
        <span>仅影响系统参数，不改写规则库</span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="glass-panel col-span-12 rounded-2xl border border-[#DCE4EE] p-8 shadow-[0_12px_30px_rgba(31,59,53,0.06)] xl:col-span-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#1F4E79]" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
              <h2 className="font-headline text-xl font-bold">模型配置</h2>
            </div>
            <span className="rounded-full bg-[#1F4E79]/10 px-3 py-1 text-[10px] font-label uppercase tracking-widest text-[#1F4E79]">Engine active</span>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <label className="block font-label text-xs uppercase tracking-widest text-[#7B8898]">分析引擎选择</label>
              <div className="relative">
                <select
                  value={settings.engine}
                  onChange={(event) => updateEngine(event.target.value)}
                  className="w-full appearance-none rounded-xl bg-[#DCE4EE] px-4 py-4 pr-10 text-sm font-medium text-[#1F2A37] outline-none ring-0"
                >
                  <option>Aether LLM v4.2 (默认)</option>
                  <option>GPT-4 Core Analysis</option>
                  <option>Claude 3.5 Specialized</option>
                  <option>本地离线深度模型</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8898]">expand_more</span>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block font-label text-xs uppercase tracking-widest text-[#7B8898]">推理温度 (Temperature)</label>
              <div className="pt-4">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={Math.round(settings.temperature * 100)}
                  onChange={(event) => updateNumber("temperature", Number(event.target.value) / 100)}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#DCE4EE] accent-[#1F4E79]"
                />
                <div className="mt-3 flex justify-between font-label text-[10px] text-[#7B8898]">
                  <span>精确 (0.1)</span>
                  <span className="font-bold text-[#1F4E79]">当前: {settings.temperature.toFixed(1)}</span>
                  <span>创意 (1.0)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-white/40 p-6">
            <label className="mb-4 block font-label text-xs uppercase tracking-widest text-[#7B8898]">上下文窗口限制 (Tokens)</label>
            <div className="flex items-center gap-6">
              <input
                type="range"
                min={4000}
                max={128000}
                step={1000}
                value={settings.maxTokens}
                onChange={(event) => updateNumber("maxTokens", Number(event.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-[#DCE4EE] accent-[#3A6A9A]"
              />
              <span className="w-28 text-right font-label text-sm text-[#3A6A9A]">{settings.maxTokens.toLocaleString("zh-CN")} TK</span>
            </div>
          </div>
        </section>

        <section className="glass-panel col-span-12 rounded-2xl border border-[#DCE4EE] p-8 shadow-[0_12px_30px_rgba(31,59,53,0.06)] xl:col-span-4">
          <div className="mb-8 flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-[#3A6A9A]" style={{ fontVariationSettings: '"FILL" 1' }}>settings_suggest</span>
            <h2 className="font-headline text-xl font-bold">全局参数</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-3 flex items-end justify-between">
                <label className="font-label text-xs uppercase tracking-widest text-[#7B8898]">任务并发数</label>
                <span className="font-label text-sm text-[#3A6A9A]">{String(settings.concurrency).padStart(2, "0")}</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={settings.concurrency}
                onChange={(event) => updateNumber("concurrency", Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#DCE4EE] accent-[#3A6A9A]"
              />
            </div>

            <div>
              <label className="mb-3 block font-label text-xs uppercase tracking-widest text-[#7B8898]">存储保留时长 (天)</label>
              <div className="flex gap-2">
                {[30, 90, 365].map((days) => {
                  const active = settings.retentionDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => applyRetention(days as 30 | 90 | 365)}
                      className={
                        active
                          ? "flex-1 rounded-lg bg-[#3A6A9A] py-3 text-sm font-bold text-white"
                          : "flex-1 rounded-lg bg-[#DCE4EE] py-3 text-sm text-[#5F6B7A] transition-colors hover:bg-[#D3DDE8]"
                      }
                    >
                      {days}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 border-t border-[#DCE4EE] pt-4">
              <ToggleRow label="自动清理过期日志" checked={settings.autoCleanup} onToggle={() => updateBoolean("autoCleanup")} />
              <ToggleRow label="异常实时推送" checked={settings.realtimePush} onToggle={() => updateBoolean("realtimePush")} />
            </div>
          </div>
        </section>

        <section className="glass-panel col-span-12 rounded-2xl border border-[#DCE4EE] p-8 shadow-[0_12px_30px_rgba(31,59,53,0.06)]">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#3A6A9A]" style={{ fontVariationSettings: '"FILL" 1' }}>description</span>
              <div>
                <h2 className="font-headline text-xl font-bold">导出模板管理</h2>
                <p className="mt-1 text-sm text-[#5F6B7A]">当前自定义模板 {customTemplateCount} 个，点击卡片可切换默认导出模板。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleCreateTemplate} className="inline-flex items-center gap-2 text-xs font-label uppercase tracking-widest text-[#3A6A9A] transition-colors hover:text-[#1F4E79]">
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>创建自定义模板</span>
              </button>
              <button type="button" onClick={() => uploadInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-[#D3DDE8] bg-[#FFFFFF] px-4 py-2 text-xs font-label uppercase tracking-widest text-[#5F6B7A] transition-all hover:border-[#4E7FAA]">
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>上传模板文件</span>
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleTemplateUpload(file);
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {templates.map((template) => {
              const active = template.id === activeTemplateId;
              return (
                <div
                  key={template.id}
                  className={
                    active
                      ? "overflow-hidden rounded-xl border border-[#9FB3CA] bg-[#F8FAFD] p-1 shadow-[0_6px_18px_rgba(31,78,121,0.12)]"
                      : "overflow-hidden rounded-xl border border-[#DCE4EE] bg-[#F8FAFD] p-1 transition-all hover:border-[#9FB3CA]"
                  }
                >
                  <button
                    type="button"
                    onClick={() => void handleTemplatePick(template.id)}
                    className="w-full text-left"
                  >
                    <div className="relative mb-4 h-32 rounded-lg bg-[#DCE4EE]">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#7B93AD]/20 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="block text-[10px] font-label text-[#5F6B7A]">FORMAT</span>
                        <span className="text-xs font-bold text-[#1F2A37]">{template.format}</span>
                      </div>
                      {active ? (
                        <div className="absolute right-2 top-2">
                          <span className="material-symbols-outlined text-lg text-[#3A6A9A]">check_circle</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="px-3 pb-3">
                      <p className="mb-1 text-sm font-bold text-[#1F2A37]">{template.name}</p>
                      <p className="text-[10px] uppercase tracking-tight text-[#5F6B7A]">{template.description}</p>
                    </div>
                  </button>
                  {template.filePath ? (
                    <div className="px-3 pb-3">
                      <button
                        type="button"
                        onClick={() => void handleTemplateDownload(template)}
                        disabled={templateBusy}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#1F4E79] transition-colors hover:text-[#3A6A9A] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>下载模板</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-10 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setSettings(data.settings)}
          className="rounded-lg border border-[#D3DDE8] bg-[#FFFFFF] px-6 py-3 text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#4E7FAA]"
        >
          重置默认设置
        </button>
        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={saving || templateBusy}
          className="rounded-lg bg-gradient-to-r from-[#1F4E79] to-[#2F5F8E] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_-4px_rgba(31,78,121,0.32)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "保存中..." : "确认并保存设置"}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#5F6B7A]">{label}</span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={onToggle}
        className={checked ? "relative h-5 w-10 rounded-full bg-[#1F4E79]/20 p-0.5" : "relative h-5 w-10 rounded-full bg-[#DCE4EE] p-0.5"}
      >
        <span className={checked ? "absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-[#1F4E79]" : "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[#97A4B2]"} />
      </button>
    </div>
  );
}

function normalizeTemplateId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

