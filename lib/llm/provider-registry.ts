import { getLlmConfig } from "@/lib/llm/config";
import { createMockProvider } from "@/lib/llm/providers/mock-provider";
import { createOpenAiCompatibleProvider } from "@/lib/llm/providers/openai-compatible-provider";
import type { LlmProvider, LlmProviderId } from "@/lib/llm/types";

export function getLlmProvider(providerId?: LlmProviderId | null): LlmProvider | null {
  const config = getLlmConfig();
  const resolvedProvider = providerId === undefined ? config.provider : providerId;

  if (!resolvedProvider) {
    return null;
  }

  if (resolvedProvider === "mock") {
    return createMockProvider(config.model || "mock-ops-analyst-v1");
  }

  if (resolvedProvider === "openai-compatible") {
    return createOpenAiCompatibleProvider();
  }

  return null;
}
