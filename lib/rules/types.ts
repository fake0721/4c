export type MatchType = "keyword" | "regex" | "threshold" | "repeat";
export type RuleCategory = "detection" | "extraction" | "aggregation" | "weak_signal";
export type RiskLevel = "low" | "medium" | "high";
export type StandardErrorType =
  | "database_error"
  | "network_error"
  | "permission_error"
  | "service_error"
  | "configuration_error"
  | "resource_exhaustion"
  | "timeout"
  | "unknown_error";

export type DetectionRule = {
  id: string;
  templateRuleId?: string;
  name: string;
  description: string;
  ruleCategory?: RuleCategory;
  matchType: MatchType;
  pattern: string;
  flags?: string;
  errorType: string;
  riskLevel: RiskLevel;
  sourceTypes?: string[];
  subTags?: string[];
  source?: string;
  scenario?: string;
  exampleLog?: string;
  notes?: string;
  enabled?: boolean;
};

export type DetectedIncident = {
  ruleId: string;
  ruleName: string;
  errorType: string;
  riskLevel: RiskLevel;
  lineNumber: number;
  rawText: string;
};
