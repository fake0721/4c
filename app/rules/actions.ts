"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  normalizeErrorType,
  normalizeMatchType,
  normalizeRiskLevel,
  normalizeRuleCategory,
} from "@/lib/rules/taxonomy";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseSourceTypes(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isMissingRuleLibraryColumnError(message: string) {
  return /column|schema cache|Could not find the '.*' column/i.test(message);
}

export async function createDetectionRuleAction(formData: FormData) {
  const returnPath = getTrimmedValue(formData, "returnPath") || "/dashboard/reviews";

  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", returnPath, "Supabase 未配置。");
  }

  const name = getTrimmedValue(formData, "name");
  const description = getTrimmedValue(formData, "description");
  const pattern = getTrimmedValue(formData, "pattern");
  const flags = getTrimmedValue(formData, "flags");
  const errorTypeInput = getTrimmedValue(formData, "errorType");
  const sourceTypes = parseSourceTypes(getTrimmedValue(formData, "sourceTypes"));

  if (!name || !pattern || !errorTypeInput) {
    return encodedRedirect("error", returnPath, "规则名称、匹配模式和异常类型不能为空。");
  }

  const matchType = normalizeMatchType(getTrimmedValue(formData, "matchType"));
  const riskLevel = normalizeRiskLevel(getTrimmedValue(formData, "riskLevel"));
  const normalizedErrorType = normalizeErrorType(errorTypeInput);
  const ruleCategory = normalizeRuleCategory(getTrimmedValue(formData, "ruleCategory"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "请先登录后再沉淀规则。");
  }

  let { error } = await supabase.from("detection_rules").insert({
    name,
    description: description || null,
    rule_category: ruleCategory,
    pattern,
    match_type: matchType,
    flags: flags || null,
    error_type: normalizedErrorType.errorType,
    risk_level: riskLevel,
    source_types: sourceTypes,
    sub_tags: normalizedErrorType.subTags,
    enabled: true,
    created_by: user.id,
  });

  if (error && isMissingRuleLibraryColumnError(error.message)) {
    const fallbackResult = await supabase.from("detection_rules").insert({
      name,
      description: description || null,
      pattern,
      match_type: matchType,
      flags: flags || null,
      error_type: normalizedErrorType.errorType,
      risk_level: riskLevel,
      source_types: sourceTypes,
      enabled: true,
      created_by: user.id,
    });
    error = fallbackResult.error;
  }

  if (error) {
    return encodedRedirect("error", returnPath, error.message);
  }

  return encodedRedirect("success", returnPath, `规则“${name}”已保存。`);
}
