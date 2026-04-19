import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  normalizeErrorType,
  normalizeMatchType,
  normalizeRiskLevel,
  normalizeRuleCategory,
} from "@/lib/rules/taxonomy";
import type { DetectionRule } from "@/lib/rules/types";

export type SelectableDetectionRule = {
  id: string;
  name: string;
  pattern: string;
  errorType: string;
  riskLevel: "low" | "medium" | "high";
  enabled: boolean;
  updatedAt: string;
  source: "rule" | "knowledge";
};

type DetectionRuleRow = {
  id: string;
  template_rule_id?: string | null;
  name: string;
  description: string | null;
  rule_category?: string | null;
  pattern: string;
  match_type: string;
  flags: string | null;
  error_type: string;
  risk_level: string;
  source_types: string[] | null;
  sub_tags?: string[] | null;
  source?: string | null;
  scenario?: string | null;
  example_log?: string | null;
  notes?: string | null;
  enabled: boolean;
};

function getDisabledKnowledgeIdsFromMetadata(metadata: unknown) {
  const record = (metadata ?? {}) as Record<string, unknown>;
  const raw = Array.isArray(record.disabledKnowledgeIds) ? record.disabledKnowledgeIds : [];
  return new Set(raw.map((item) => String(item ?? "").trim()).filter(Boolean));
}

function mapRowToRule(row: DetectionRuleRow): DetectionRule {
  const normalizedErrorType = normalizeErrorType(row.error_type, row.sub_tags ?? []);

  return {
    id: row.id,
    templateRuleId: row.template_rule_id ?? undefined,
    name: row.name,
    description: row.description ?? "",
    ruleCategory: normalizeRuleCategory(row.rule_category),
    pattern: row.pattern,
    matchType: normalizeMatchType(row.match_type),
    flags: row.flags ?? undefined,
    errorType: normalizedErrorType.errorType,
    riskLevel: normalizeRiskLevel(row.risk_level),
    sourceTypes: row.source_types ?? undefined,
    subTags: normalizedErrorType.subTags,
    source: row.source ?? undefined,
    scenario: row.scenario ?? undefined,
    exampleLog: row.example_log ?? undefined,
    notes: row.notes ?? undefined,
    enabled: row.enabled,
  };
}

async function selectExtendedRules() {
  const supabase = await createClient();
  const result = await supabase
    .from("detection_rules")
    .select(
      "id, template_rule_id, name, description, rule_category, pattern, match_type, flags, error_type, risk_level, source_types, sub_tags, source, scenario, example_log, notes, enabled",
    )
    .eq("enabled", true);

  if (!result.error) {
    return result;
  }

  const fallback = await supabase
    .from("detection_rules")
    .select(
      "id, name, description, pattern, match_type, flags, error_type, risk_level, source_types, enabled",
    )
    .eq("enabled", true);

  return fallback;
}

export async function getDynamicDetectionRules() {
  if (!hasSupabaseEnv()) {
    return [] as DetectionRule[];
  }

  const { data, error } = await selectExtendedRules();

  if (error || !data) {
    return [] as DetectionRule[];
  }

  return data.map((row) => mapRowToRule(row as DetectionRuleRow));
}

export async function getSelectableDetectionRules() {
  if (!hasSupabaseEnv()) {
    return [] as SelectableDetectionRule[];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [] as SelectableDetectionRule[];
  }

  const disabledKnowledgeIds = getDisabledKnowledgeIdsFromMetadata(user.user_metadata);

  const { data, error } = await supabase
    .from("detection_rules")
    .select("id, name, pattern, error_type, risk_level, enabled, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  const rules = error || !data
    ? []
    : data.map((item) => ({
        id: `rule:${String(item.id)}`,
        name: String(item.name ?? "未命名规则").trim() || "未命名规则",
        pattern: String(item.pattern ?? "").trim(),
        errorType: String(item.error_type ?? "unknown_error").trim() || "unknown_error",
        riskLevel: normalizeRiskLevel(String(item.risk_level ?? "medium")),
        enabled: item.enabled !== false,
        updatedAt: String(item.updated_at ?? ""),
        source: "rule" as const,
      }));

  const knowledgeWithErrorType = await supabase
    .from("knowledge_base")
    .select("id, title, symptom, error_type, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  const knowledgeFallback = !knowledgeWithErrorType.error && knowledgeWithErrorType.data
    ? null
    : await supabase
        .from("knowledge_base")
        .select("id, title, symptom")
        .order("id", { ascending: false })
        .limit(500);

  const knowledgeRows = knowledgeFallback
    ? (knowledgeFallback.data ?? []).map((item) => ({
        id: String(item.id),
        title: String(item.title ?? "未命名知识条目"),
        symptom: String(item.symptom ?? ""),
        error_type: "unknown_error",
        updated_at: "",
      }))
    : (knowledgeWithErrorType.data ?? []).map((item) => ({
        id: String(item.id),
        title: String(item.title ?? "未命名知识条目"),
        symptom: String(item.symptom ?? ""),
        error_type: String((item as { error_type?: string | null }).error_type ?? "unknown_error"),
        updated_at: String((item as { updated_at?: string | null }).updated_at ?? ""),
      }));

  const knowledge = knowledgeRows.map((item) => ({
    id: `knowledge:${item.id}`,
    name: item.title.trim() || "未命名知识条目",
    pattern: item.symptom.trim() || item.title.trim(),
    errorType: item.error_type.trim() || "unknown_error",
    riskLevel: "medium" as const,
    enabled: !disabledKnowledgeIds.has(item.id),
    updatedAt: item.updated_at,
    source: "knowledge" as const,
  }));

  return [...rules, ...knowledge];
}
