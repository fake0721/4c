import type {
  NormalizedKnowledgeImport,
  NormalizedRuleImport,
} from "@/lib/imports/types";
import {
  normalizeErrorType,
  normalizeMatchType,
  normalizeRiskLevel,
  normalizeRuleCategory,
} from "@/lib/rules/taxonomy";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown) {
  const text = asTrimmedString(value);
  return text ? text : null;
}

function normalizeTagValue(value: string) {
  const raw = value.trim();
  if (!raw) {
    return "";
  }

  if (/[\u4e00-\u9fa5]/.test(raw)) {
    return raw;
  }

  return raw
    .toLowerCase()
    .replace(/[\s/-]+/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asStringArray(value: unknown, preserveCase = false) {
  const finalize = (items: string[]) =>
    Array.from(
      new Set(
        items
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => (preserveCase ? item : normalizeTagValue(item))),
      ),
    );

  if (Array.isArray(value)) {
    return finalize(value.map((item) => asTrimmedString(item)).filter(Boolean));
  }

  const text = asTrimmedString(value);
  if (!text) {
    return [] as string[];
  }

  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return finalize(parsed.map((item) => asTrimmedString(item)).filter(Boolean));
      }
    } catch {
      // Fallback to delimiter-based split below.
    }
  }

  return finalize(text.split(/[,，;；|]/));
}

function getFirstValue<T extends string>(row: PlainObject, keys: T[]) {
  for (const key of keys) {
    if (key in row) {
      return row[key];
    }
  }
  return undefined;
}

function parseJsonArray(payload: string) {
  const text = payload.trim();
  if (!text) {
    throw new Error("请先粘贴 JSON 数组内容。");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSON 格式不正确，请检查逗号、引号和括号。");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("导入内容必须是 JSON 数组。");
  }

  return parsed;
}

export function parseRuleImportPayload(payload: string) {
  const rows = parseJsonArray(payload);
  const items: NormalizedRuleImport[] = [];

  rows.forEach((row, index) => {
    if (!isPlainObject(row)) {
      throw new Error(`第 ${index + 1} 条规则不是对象。`);
    }

    const name = asTrimmedString(getFirstValue(row, ["name", "title", "rule_name"]));
    const pattern = asTrimmedString(
      getFirstValue(row, ["pattern", "match", "expression", "pattern_or_condition"]),
    );
    const errorTypeValue = asTrimmedString(
      getFirstValue(row, ["errorType", "error_type", "category"]),
    );

    if (!name || !pattern || !errorTypeValue) {
      throw new Error(`第 ${index + 1} 条规则缺少 name、pattern 或 errorType。`);
    }

    const ruleCategory = normalizeRuleCategory(
      asTrimmedString(getFirstValue(row, ["ruleCategory", "rule_category"])),
    );
    const matchType = normalizeMatchType(
      asTrimmedString(getFirstValue(row, ["matchType", "match_type", "type"])),
    );
    const riskLevel = normalizeRiskLevel(
      asTrimmedString(getFirstValue(row, ["riskLevel", "risk_level", "severity"])),
    );
    const subTags = asStringArray(getFirstValue(row, ["subTags", "sub_tags", "tags"]));
    const normalizedErrorType = normalizeErrorType(errorTypeValue, subTags);

    items.push({
      templateRuleId: asNullableString(getFirstValue(row, ["templateRuleId", "template_rule_id", "rule_id"])),
      name,
      description: asNullableString(getFirstValue(row, ["description", "desc"])),
      ruleCategory,
      pattern,
      matchType,
      flags: asNullableString(getFirstValue(row, ["flags", "regexFlags", "regex_flags"])),
      errorType: normalizedErrorType.errorType,
      riskLevel,
      sourceTypes: asStringArray(
        getFirstValue(row, ["sourceTypes", "source_types", "sources"]),
      ),
      subTags: normalizedErrorType.subTags,
      source: asNullableString(getFirstValue(row, ["source", "basis"])),
      scenario: asNullableString(getFirstValue(row, ["scenario", "scene"])),
      exampleLog: asNullableString(getFirstValue(row, ["exampleLog", "example_log"])),
      notes: asNullableString(getFirstValue(row, ["notes", "remark"])),
      enabled: getFirstValue(row, ["enabled"]) === false ? false : true,
    });
  });

  return items;
}

export function parseKnowledgeImportPayload(payload: string) {
  const rows = parseJsonArray(payload);
  const items: NormalizedKnowledgeImport[] = [];

  rows.forEach((row, index) => {
    if (!isPlainObject(row)) {
      throw new Error(`第 ${index + 1} 条知识不是对象。`);
    }

    const title = asTrimmedString(getFirstValue(row, ["title", "name"]));
    const solution = asNullableString(getFirstValue(row, ["solution", "resolution", "fix"]));
    const symptom = asNullableString(getFirstValue(row, ["symptom", "issue", "problem"]));

    if (!title) {
      throw new Error(`第 ${index + 1} 条知识缺少 title。`);
    }

    items.push({
      title,
      category: asNullableString(getFirstValue(row, ["category", "type"])),
      keywords: asNullableString(getFirstValue(row, ["keywords", "tags"])),
      symptom,
      possibleCause: asNullableString(
        getFirstValue(row, ["possibleCause", "possible_cause", "cause"]),
      ),
      solution,
      source: asNullableString(getFirstValue(row, ["source", "origin"])),
    });
  });

  return items;
}

export function buildRuleFingerprint(item: NormalizedRuleImport) {
  return [
    item.ruleCategory.trim().toLowerCase(),
    item.matchType.trim().toLowerCase(),
    item.name.trim().toLowerCase(),
    item.pattern.trim().toLowerCase(),
    item.errorType.trim().toLowerCase(),
  ].join("::");
}

export function buildKnowledgeFingerprint(item: NormalizedKnowledgeImport) {
  return [
    item.title.trim().toLowerCase(),
    (item.symptom ?? "").trim().toLowerCase(),
    (item.solution ?? "").trim().toLowerCase(),
  ].join("::");
}
