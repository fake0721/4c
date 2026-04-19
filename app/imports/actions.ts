"use server";

import { revalidatePath } from "next/cache";
import {
  buildKnowledgeFingerprint,
  buildRuleFingerprint,
  parseKnowledgeImportPayload,
  parseRuleImportPayload,
} from "@/lib/imports/normalize";
import { createClient } from "@/lib/supabase/server-client";
import { encodedRedirect } from "@/lib/utils";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { NormalizedRuleImport } from "@/lib/imports/types";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isMissingRuleLibraryColumnError(message: string) {
  return /column|schema cache|Could not find the '.*' column/i.test(message);
}

function buildRuleInsertRow(item: NormalizedRuleImport, userId: string, includeExtendedFields: boolean) {
  const baseRow = {
    name: item.name,
    description: item.description,
    pattern: item.pattern,
    match_type: item.matchType,
    flags: item.flags,
    error_type: item.errorType,
    risk_level: item.riskLevel,
    source_types: item.sourceTypes,
    enabled: item.enabled,
    created_by: userId,
  };

  if (!includeExtendedFields) {
    return baseRow;
  }

  return {
    ...baseRow,
    template_rule_id: item.templateRuleId,
    rule_category: item.ruleCategory,
    sub_tags: item.subTags,
    source: item.source,
    scenario: item.scenario,
    example_log: item.exampleLog,
    notes: item.notes,
  };
}

export async function importDetectionRulesAction(formData: FormData) {
  const returnPath = getTrimmedValue(formData, "returnPath") || "/dashboard/reviews";
  const payload = getTrimmedValue(formData, "payload");

  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", returnPath, "Supabase 未配置。");
  }

  let items;
  try {
    items = parseRuleImportPayload(payload);
  } catch (error) {
    return encodedRedirect("error", returnPath, error instanceof Error ? error.message : "规则导入失败。");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "请先登录后再导入规则。");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("detection_rules")
    .select("name, pattern, error_type, match_type");

  if (existingError) {
    return encodedRedirect("error", returnPath, existingError.message);
  }

  const existingSet = new Set(
    (existingRows ?? []).map((row) =>
      buildRuleFingerprint({
        templateRuleId: null,
        name: row.name,
        description: null,
        ruleCategory: "detection",
        pattern: row.pattern,
        matchType: row.match_type === "regex" ? "regex" : row.match_type === "threshold" ? "threshold" : row.match_type === "repeat" ? "repeat" : "keyword",
        flags: null,
        errorType: row.error_type,
        riskLevel: "medium",
        sourceTypes: [],
        subTags: [],
        source: null,
        scenario: null,
        exampleLog: null,
        notes: null,
        enabled: true,
      }),
    ),
  );

  const uniqueItems = items.filter((item) => !existingSet.has(buildRuleFingerprint(item)));

  if (uniqueItems.length === 0) {
    return encodedRedirect("success", returnPath, "规则库已存在相同内容，没有新增规则。");
  }

  let { error } = await supabase.from("detection_rules").insert(
    uniqueItems.map((item) => buildRuleInsertRow(item, user.id, true)),
  );

  if (error && isMissingRuleLibraryColumnError(error.message)) {
    const fallbackResult = await supabase.from("detection_rules").insert(
      uniqueItems.map((item) => buildRuleInsertRow(item, user.id, false)),
    );
    error = fallbackResult.error;
  }

  if (error) {
    return encodedRedirect("error", returnPath, error.message);
  }

  revalidatePath("/dashboard/reviews");
  revalidatePath("/dashboard");

  return encodedRedirect("success", returnPath, `已导入 ${uniqueItems.length} 条规则。`);
}

export async function importKnowledgeBaseAction(formData: FormData) {
  const returnPath = getTrimmedValue(formData, "returnPath") || "/dashboard/reviews";
  const payload = getTrimmedValue(formData, "payload");

  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", returnPath, "Supabase 未配置。");
  }

  let items;
  try {
    items = parseKnowledgeImportPayload(payload);
  } catch (error) {
    return encodedRedirect("error", returnPath, error instanceof Error ? error.message : "知识库导入失败。");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "请先登录后再导入知识库。");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("knowledge_base")
    .select("title, symptom, solution");

  if (existingError) {
    return encodedRedirect("error", returnPath, existingError.message);
  }

  const existingSet = new Set(
    (existingRows ?? []).map((row) =>
      buildKnowledgeFingerprint({
        title: row.title,
        category: null,
        keywords: null,
        symptom: row.symptom,
        possibleCause: null,
        solution: row.solution,
        source: null,
      }),
    ),
  );

  const uniqueItems = items.filter((item) => !existingSet.has(buildKnowledgeFingerprint(item)));

  if (uniqueItems.length === 0) {
    return encodedRedirect("success", returnPath, "知识库已存在相同内容，没有新增条目。");
  }

  const { error } = await supabase.from("knowledge_base").insert(
    uniqueItems.map((item) => ({
      title: item.title,
      category: item.category,
      keywords: item.keywords,
      symptom: item.symptom,
      possible_cause: item.possibleCause,
      solution: item.solution,
      source: item.source,
    })),
  );

  if (error) {
    return encodedRedirect("error", returnPath, error.message);
  }

  revalidatePath("/dashboard/reviews");
  revalidatePath("/dashboard");

  return encodedRedirect("success", returnPath, `已导入 ${uniqueItems.length} 条知识。`);
}
