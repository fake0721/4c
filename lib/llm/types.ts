import type { DetectedIncident } from "@/lib/rules/types";
import type { RagContextItem } from "@/lib/analysis/types";

export type LlmProviderId = "openai-compatible" | "mock";
export type LlmPromptMode = "rule_only" | "model_only" | "hybrid";

export type LlmAnalysisRequest = {
  sourceType: string;
  logContent: string;
  incident: DetectedIncident;
  ragContext: RagContextItem[];
  analysisMode?: LlmPromptMode;
};

export type LlmAnalysisResponse = {
  cause: string;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  repairSuggestion: string;
  tokensUsed?: number;
  model?: string;
  rawResponse?: string;
};

export type LlmProvider = {
  id: LlmProviderId;
  model: string;
  analyzeIncident(input: LlmAnalysisRequest): Promise<LlmAnalysisResponse>;
};
