import { getLlmConfig } from "@/lib/llm/config";

export type AnalysisMode = "rule_only" | "model_only" | "hybrid";

export type LlmReadiness = {
  ready: boolean;
  provider: string | null;
  missingFields: string[];
  message: string;
};

function buildMissingFieldHint(fields: string[]) {
  return fields.join("、");
}

export function getLlmReadiness(): LlmReadiness {
  const config = getLlmConfig();

  if (!config.provider) {
    return {
      ready: false,
      provider: null,
      missingFields: ["LLM_PROVIDER"],
      message: "未配置 LLM_PROVIDER，当前仅可使用 Rule Only 分析。",
    };
  }

  if (config.provider === "mock") {
    return {
      ready: true,
      provider: "mock",
      missingFields: [],
      message: "当前使用 mock 模型提供方。",
    };
  }

  const missingFields = [
    ["LLM_BASE_URL", config.baseUrl],
    ["LLM_API_KEY", config.apiKey],
    ["LLM_MODEL", config.model],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name as string);

  if (missingFields.length > 0) {
    return {
      ready: false,
      provider: config.provider,
      missingFields,
      message: `模型配置不完整，缺少 ${buildMissingFieldHint(missingFields)}。`,
    };
  }

  return {
    ready: true,
    provider: config.provider,
    missingFields: [],
    message: "模型配置已就绪。",
  };
}

export function assertAnalysisModeReady(mode: AnalysisMode) {
  if (mode === "rule_only") {
    return;
  }

  const readiness = getLlmReadiness();
  if (readiness.ready) {
    return;
  }

  const suffix = readiness.missingFields.length > 0
    ? `请先配置：${buildMissingFieldHint(readiness.missingFields)}。`
    : "请先完成大模型配置。";

  throw new Error(`当前分析模式依赖大模型，${suffix}`);
}
