import type { LlmProviderId } from "@/lib/llm/types";

const providerValue = process.env.LLM_PROVIDER?.trim().toLowerCase();
const timeoutValue = Number.parseInt(process.env.LLM_TIMEOUT_MS ?? "20000", 10);

export function getLlmConfig() {
  return {
    provider:
      providerValue === "openai-compatible" || providerValue === "mock"
        ? (providerValue as LlmProviderId)
        : null,
    baseUrl: process.env.LLM_BASE_URL?.trim() || "",
    apiKey: process.env.LLM_API_KEY?.trim() || "",
    model: process.env.LLM_MODEL?.trim() || "",
    fallbackModel: process.env.LLM_FALLBACK_MODEL?.trim() || "",
    timeoutMs: Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : 20000,
  };
}

export function hasActiveLlmProvider() {
  return Boolean(getLlmConfig().provider);
}
