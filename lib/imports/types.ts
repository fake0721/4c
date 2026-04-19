import type { MatchType, RiskLevel, RuleCategory } from "@/lib/rules/types";

export type NormalizedRuleImport = {
  templateRuleId: string | null;
  name: string;
  description: string | null;
  ruleCategory: RuleCategory;
  pattern: string;
  matchType: MatchType;
  flags: string | null;
  errorType: string;
  riskLevel: RiskLevel;
  sourceTypes: string[];
  subTags: string[];
  source: string | null;
  scenario: string | null;
  exampleLog: string | null;
  notes: string | null;
  enabled: boolean;
};

export type NormalizedKnowledgeImport = {
  title: string;
  category: string | null;
  keywords: string | null;
  symptom: string | null;
  possibleCause: string | null;
  solution: string | null;
  source: string | null;
};
