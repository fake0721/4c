import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type SystemSettings = {
  engine: string;
  temperature: number;
  maxTokens: number;
  concurrency: number;
  retentionDays: 30 | 90 | 365;
  autoCleanup: boolean;
  realtimePush: boolean;
};

export type ExportTemplate = {
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

export type SettingsPageData = {
  settings: SystemSettings;
  exportTemplates: ExportTemplate[];
  activeExportTemplateId: string;
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

const DEFAULT_ACTIVE_EXPORT_TEMPLATE_ID = "pdf-standard";

function asNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeTemplateId(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
      fileSize: typeof record.fileSize === "number" && Number.isFinite(record.fileSize) ? record.fileSize : undefined,
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

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const fallback: SettingsPageData = {
    settings: DEFAULT_SYSTEM_SETTINGS,
    exportTemplates: BUILTIN_EXPORT_TEMPLATES,
    activeExportTemplateId: DEFAULT_ACTIVE_EXPORT_TEMPLATE_ID,
  };

  if (!hasSupabaseEnv()) {
    return fallback;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fallback;
  }

  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const settings = toSystemSettings(userMetadata.systemSettings);
  const exportTemplates = toExportTemplates(userMetadata.exportTemplates);
  const activeExportTemplateId = toActiveExportTemplateId(userMetadata.activeExportTemplateId, exportTemplates);

  return {
    settings,
    exportTemplates,
    activeExportTemplateId,
  };
}
