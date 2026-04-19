export type EmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
};

export type EmbeddingInputOptions = {
  maxLength?: number;
};

function parseEmbeddingDimensions(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1536", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1536;
}

function getEmbeddingConfig() {
  const timeoutValue = Number.parseInt(process.env.RAG_EMBEDDING_TIMEOUT_MS ?? "15000", 10);

  return {
    baseUrl: process.env.LLM_BASE_URL?.trim() || "",
    apiKey:
      process.env.RAG_EMBEDDING_API_KEY?.trim() ||
      process.env.LLM_API_KEY?.trim() ||
      "",
    model:
      process.env.RAG_EMBEDDING_MODEL?.trim() ||
      process.env.LLM_EMBEDDING_MODEL?.trim() ||
      "",
    dimensions: parseEmbeddingDimensions(process.env.RAG_EMBEDDING_DIMENSIONS),
    timeoutMs: Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : 15000,
  };
}

export function hasEmbeddingConfig() {
  const config = getEmbeddingConfig();
  return Boolean(config.baseUrl && config.apiKey && config.model);
}

export function buildEmbeddingInput(
  parts: Array<string | null | undefined>,
  options: EmbeddingInputOptions = {},
) {
  const content = parts
    .map((item) => item?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!content) {
    return "";
  }

  const maxLength = options.maxLength;
  if (!Number.isFinite(maxLength) || !maxLength || maxLength <= 0) {
    return content;
  }

  return content.slice(0, maxLength);
}

export async function embedText(input: string): Promise<number[] | null> {
  const config = getEmbeddingConfig();

  if (!config.baseUrl || !config.apiKey || !config.model) {
    return null;
  }

  const content = input.trim();
  if (!content) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: content,
        dimensions: config.dimensions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as EmbeddingResponse;
    const embedding = payload.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.length !== config.dimensions) {
      return null;
    }

    return embedding;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
