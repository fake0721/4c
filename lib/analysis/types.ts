import type { DetectedIncident } from "@/lib/rules/types";

export type RagContextItem = {
  title: string;
  summary: string;
  source: string;
  score?: number;
};

export type NormalizedAnalysisResult = {
  cause: string;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  repairSuggestion: string;
  ragContext: RagContextItem[];
  modelName: string;
  latencyMs: number | null;
  tokensUsed: number;
  providerId: string;
  source: "rule" | "llm";
};

export type IncidentAnalysisInput = {
  incident: DetectedIncident;
  sourceType: string;
  logContent: string;
  ragContext?: RagContextItem[];
};
