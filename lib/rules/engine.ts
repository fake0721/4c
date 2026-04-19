import { defaultDetectionRules } from "@/lib/rules/default-rules";
import type { DetectedIncident, DetectionRule } from "@/lib/rules/types";

export interface RuleDetectionResult {
  incidentId: string;
  logId: string;
  sourceType: string;
  errorType: string;
  severity: DetectionRule["riskLevel"];
  matchedLines: number[];
  matchedKeywords: string[];
  snippet: string;
  sourceRuleIds: string[];
  ruleName?: string;
  rawText: string;
  detectedBy: "rule" | "rule+db";
}

export type RuleDetectionResultCompat = RuleDetectionResult & DetectedIncident;

function normalizeSourceType(sourceType: string) {
  return sourceType.trim().toLowerCase() || "custom";
}

function isRuleEnabled(rule: DetectionRule, sourceType: string) {
  if (rule.enabled === false) {
    return false;
  }

  if (!rule.sourceTypes || rule.sourceTypes.length === 0) {
    return true;
  }

  return rule.sourceTypes.includes(sourceType);
}

function matchesRule(line: string, rule: DetectionRule) {
  if (rule.matchType === "keyword") {
    return line.toLowerCase().includes(rule.pattern.toLowerCase());
  }

  if (rule.matchType === "regex") {
    return new RegExp(rule.pattern, rule.flags).test(line);
  }

  return false;
}

function isStackTraceNoiseLine(line: string) {
  return (
    /^at\s+[\w.$/<>-]+\(/.test(line) ||
    /^\.\.\.\s+\d+\s+(?:more|common frames omitted)/i.test(line) ||
    /^Suppressed:\s+/i.test(line)
  );
}

function createIncidentId(ruleId: string, lineNumber: number) {
  return `rule:${ruleId}:${lineNumber}`;
}

function buildRuleDetectionResult(params: {
  matchedRule: DetectionRule;
  normalizedLine: string;
  lineNumber: number;
  sourceType: string;
}): RuleDetectionResultCompat {
  const { matchedRule, normalizedLine, lineNumber, sourceType } = params;

  return {
    incidentId: createIncidentId(matchedRule.id, lineNumber),
    logId: "",
    sourceType,
    errorType: matchedRule.errorType,
    severity: matchedRule.riskLevel,
    matchedLines: [lineNumber],
    matchedKeywords: [],
    snippet: normalizedLine,
    sourceRuleIds: [matchedRule.id],
    ruleName: matchedRule.name,
    rawText: normalizedLine,
    detectedBy: "rule",
    ruleId: matchedRule.id,
    riskLevel: matchedRule.riskLevel,
    lineNumber,
  };
}

export function detectLogIncidents(
  content: string,
  sourceType: string,
  databaseRules: DetectionRule[] = [],
  options?: {
    includeDefaultRules?: boolean;
  },
) {
  const normalizedSourceType = normalizeSourceType(sourceType);
  const includeDefaultRules = options?.includeDefaultRules !== false;
  const rules = [...(includeDefaultRules ? defaultDetectionRules : []), ...databaseRules].filter((rule) =>
    isRuleEnabled(rule, normalizedSourceType),
  );

  const lines = content.split(/\r\n|\r|\n/);
  const incidents: RuleDetectionResultCompat[] = [];

  lines.forEach((line, index) => {
    const normalizedLine = line.trim();

    if (!normalizedLine || isStackTraceNoiseLine(normalizedLine)) {
      return;
    }

    const matchedRule = rules.find((rule) => matchesRule(normalizedLine, rule));

    if (!matchedRule) {
      return;
    }

    incidents.push(
      buildRuleDetectionResult({
        matchedRule,
        normalizedLine,
        lineNumber: index + 1,
        sourceType: normalizedSourceType,
      }),
    );
  });

  return incidents;
}
