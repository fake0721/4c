import { buildRuleAnalysisDraft } from "@/lib/analysis/rule-analysis";
import type { LlmProvider } from "@/lib/llm/types";

export function createMockProvider(model = "mock-ops-analyst-v1"): LlmProvider {
  return {
    id: "mock",
    model,
    async analyzeIncident(input) {
      const draft = buildRuleAnalysisDraft(input.incident, input.sourceType);

      return {
        cause: draft.cause,
        riskLevel: draft.riskLevel,
        confidence: Math.min(0.95, draft.confidence + 0.03),
        repairSuggestion: draft.repairSuggestion,
        tokensUsed: 0,
        model,
        rawResponse: "mock-provider",
      };
    },
  };
}
