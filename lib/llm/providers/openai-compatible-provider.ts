import { getLlmConfig } from "@/lib/llm/config";
import { validateLlmAnalysisResponse } from "@/lib/llm/schema";
import type { LlmProvider } from "@/lib/llm/types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  usage?: {
    total_tokens?: number;
  };
};

const CONTEXT_LINES_BEFORE = 4;
const CONTEXT_LINES_AFTER = 6;
const MAX_EXCERPT_LENGTH = 2500;

const STRICT_HYBRID_SYSTEM_PROMPT = [
  "你是专业的智能日志分析专家，负责分析服务器/应用日志中的异常问题，严格按以下规则工作，不允许违反任何一条：",
  "1. 分析依据：仅基于提供的日志内容和知识库案例，绝对不编造任何信息。证据不足时必须明确标注“根因暂无法确定，建议人工复核”。",
  "2. 优先匹配知识库中已有的异常类型与风险等级定义；若无匹配案例，选择最接近的异常类型，并在根因中说明依据。",
  "3. 分析原则：优先识别高风险异常（如服务启动失败/OOM/安全入侵/数据丢失），日志中无异常时标注“未检测到异常，日志正常”。",
  "4. 语言要求：使用简体中文，专业、简洁，无废话，适配运维人员阅读习惯。",
  "5. 额外约束：若用户提问与日志分析、日志异常排查无关，只回复“此类不相关问题，我不回答”；不得进行任何额外解释、闲聊、扩展回答。",
  "6. 输出必须是合法 JSON 对象，不要输出 Markdown，不要输出解释文本。",
  "7. 输出键必须严格为：问题类型、风险等级、核心关键词、根因分析、解决方案、可信度。",
  "8. 风险等级只能是：高、中、低。可信度只能是：高、中、低、未知。",
  "9. 根因分析不超过200字；解决方案不超过3点。",
].join(" ");

const OPEN_MODEL_ONLY_SYSTEM_PROMPT = [
  "你是专业的智能日志分析专家。当前处于纯模型分析模式。",
  "你可以使用你已有的通用技术知识与可用的外部检索能力（如果模型端提供）进行判断，不受召回知识条目限制。",
  "允许在证据不足时给出‘最可能原因 + 不确定性说明 + 验证步骤’，但不得编造不存在的事实。",
  "输出必须是合法 JSON 对象，不要输出 Markdown，不要输出解释文本。",
  "风险等级只能是 low|medium|high。",
  "confidence 必须是 0~1 的数字。",
].join(" ");

export function createOpenAiCompatibleProvider(): LlmProvider {
  const config = getLlmConfig();

  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error("Missing LLM_BASE_URL, LLM_API_KEY, or LLM_MODEL.");
  }

  return {
    id: "openai-compatible",
    model: config.model,
    async analyzeIncident(input) {
      const candidateRequests = [
        { model: config.model, apiKey: config.apiKey },
        {
          model: config.fallbackModel || config.model,
          apiKey: config.fallbackApiKey || config.apiKey,
        },
      ].filter(
        (item, index, list) =>
          Boolean(item.model) &&
          Boolean(item.apiKey) &&
          list.findIndex(
            (candidate) =>
              candidate.model === item.model && candidate.apiKey === item.apiKey,
          ) === index,
      );
      let lastError: Error | null = null;

      for (const candidate of candidateRequests) {
        try {
          return await requestCompletion(
            candidate.model,
            input,
            config.baseUrl,
            candidate.apiKey,
            config.timeoutMs,
          );
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Unknown LLM request error.");
        }
      }

      throw lastError ?? new Error("Model request failed.");
    },
  };
}

async function requestCompletion(
  model: string,
  input: Parameters<LlmProvider["analyzeIncident"]>[0],
  baseUrl: string,
  apiKey: string,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: resolveSystemPrompt(input),
          },
          {
            role: "user",
            content: buildPrompt(input),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Model request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = normalizeContent(payload.choices?.[0]?.message?.content);

    if (!content) {
      throw new Error("Model response content was empty.");
    }

    const parsed = validateLlmAnalysisResponse(JSON.parse(content));

    return {
      ...parsed,
      model,
      tokensUsed: payload.usage?.total_tokens ?? parsed.tokensUsed ?? 0,
      rawResponse: content,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function resolveSystemPrompt(input: Parameters<LlmProvider["analyzeIncident"]>[0]) {
  return input.analysisMode === "model_only"
    ? OPEN_MODEL_ONLY_SYSTEM_PROMPT
    : STRICT_HYBRID_SYSTEM_PROMPT;
}

function normalizeContent(
  content: string | Array<{ type?: string; text?: string }> | undefined,
) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item.text === "string" ? item.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function buildPrompt(input: Parameters<LlmProvider["analyzeIncident"]>[0]) {
  if (input.analysisMode === "model_only") {
    return buildModelOnlyPrompt(input);
  }

  return buildStrictPrompt(input);
}

function buildStrictPrompt(input: Parameters<LlmProvider["analyzeIncident"]>[0]) {
  const ragContextText =
    input.ragContext.length === 0
      ? "未召回到可用知识。"
      : input.ragContext
          .map(
            (item, index) =>
              `${index + 1}. 标题: ${item.title}\n来源: ${item.source}\n摘要: ${item.summary}`,
          )
          .join("\n\n");

  const excerpt = extractIncidentExcerpt(input.logContent, input.incident.lineNumber);

  return [
    `日志来源类型: ${input.sourceType}`,
    `异常类型: ${input.incident.errorType}`,
    `异常行号: ${input.incident.lineNumber}`,
    `异常原文: ${input.incident.rawText}`,
    "",
    "当前异常附近上下文:",
    excerpt,
    "",
    "召回知识:",
    ragContextText,
    "",
    "输出要求:",
    "1. 只返回 JSON，不要返回 Markdown，不要返回解释文本。",
    "2. cause 只总结当前异常及附近上下文已经支持的原因，不要过度推断具体组件。",
    "3. 如果无法确定根因，cause 必须明确写出‘证据不足’或‘无法确定具体组件’。",
    "4. repairSuggestion 优先给排查动作，例如检查端口、依赖可达性、线程池、连接池、异常栈、邻近日志上下文。",
    "5. 不要把当前异常附近上下文以外的其他报错混进结论。",
    "6. 如果召回知识为空或相关性弱，请保持保守。",
    "",
    "只返回以下 JSON 结构:",
    '{ "cause": string, "riskLevel": "low" | "medium" | "high", "confidence": number, "repairSuggestion": string }',
  ].join("\n");
}

function buildModelOnlyPrompt(input: Parameters<LlmProvider["analyzeIncident"]>[0]) {
  const excerpt = extractIncidentExcerpt(input.logContent, input.incident.lineNumber);

  return [
    `日志来源类型: ${input.sourceType}`,
    `异常类型: ${input.incident.errorType}`,
    `异常行号: ${input.incident.lineNumber}`,
    `异常原文: ${input.incident.rawText}`,
    "",
    "当前异常附近上下文:",
    excerpt,
    "",
    "纯模型分析要求:",
    "1. 可结合通用运维知识与模型可用外部检索能力进行推断，不受召回知识限制。",
    "2. 输出聚焦最可能根因，明确给出可执行排查步骤。",
    "3. 若证据不足，必须在 cause 中明确标注不确定性，并在 repairSuggestion 中给出验证路径。",
    "4. 只返回 JSON，不要返回 Markdown，不要返回解释文本。",
    "",
    "只返回以下 JSON 结构:",
    '{ "cause": string, "riskLevel": "low" | "medium" | "high", "confidence": number, "repairSuggestion": string }',
  ].join("\n");
}

function extractIncidentExcerpt(logContent: string, lineNumber: number) {
  const lines = logContent.split(/\r\n|\r|\n/);
  if (lines.length === 0) {
    return logContent.slice(0, MAX_EXCERPT_LENGTH);
  }

  const resolvedLine = Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : 1;
  const incidentIndex = Math.min(Math.max(resolvedLine - 1, 0), Math.max(lines.length - 1, 0));
  const start = Math.max(incidentIndex - CONTEXT_LINES_BEFORE, 0);
  const end = Math.min(incidentIndex + CONTEXT_LINES_AFTER + 1, lines.length);

  const excerpt = lines
    .slice(start, end)
    .map((line, index) => `${start + index + 1}: ${line}`)
    .join("\n")
    .trim();

  return excerpt.slice(0, MAX_EXCERPT_LENGTH);
}
