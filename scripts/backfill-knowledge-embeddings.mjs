import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.resolve(scriptDir, "../.env.local"),
    path.resolve(scriptDir, "../.env"),
  ];

  for (const candidate of candidatePaths) {
    if (!existsSync(candidate)) {
      continue;
    }

    const content = readFileSync(candidate, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const baseUrl = process.env.LLM_BASE_URL?.trim() || "";
const apiKey = process.env.RAG_EMBEDDING_API_KEY?.trim() || process.env.LLM_API_KEY?.trim() || "";
const model = process.env.RAG_EMBEDDING_MODEL?.trim() || process.env.LLM_EMBEDDING_MODEL?.trim() || "";
const dimensions = Number.parseInt(process.env.RAG_EMBEDDING_DIMENSIONS ?? "1536", 10);
const batchSize = Number.parseInt(process.env.KNOWLEDGE_EMBED_BATCH_SIZE ?? "20", 10);

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

if (!baseUrl || !apiKey || !model) {
  throw new Error("Missing LLM_BASE_URL, RAG_EMBEDDING_API_KEY/LLM_API_KEY, or RAG_EMBEDDING_MODEL.");
}

if (!Number.isFinite(dimensions) || dimensions <= 0) {
  throw new Error("RAG_EMBEDDING_DIMENSIONS must be a positive integer.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function buildKnowledgeText(row) {
  return [
    row.title,
    row.category,
    row.keywords,
    row.symptom,
    row.possible_cause,
    row.solution,
    row.source,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function embedText(input) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
      dimensions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Embedding request failed with status ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const embedding = payload?.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length !== dimensions) {
    throw new Error(`Embedding response did not contain a valid ${dimensions}-dimensional vector.`);
  }

  return embedding;
}

function applyNullableFilter(query, column, value) {
  return value == null ? query.is(column, null) : query.eq(column, value);
}

async function updateEmbedding(row, embedding) {
  let query = supabase.from("knowledge_base").update({ embedding });
  query = query.eq("title", row.title);
  query = applyNullableFilter(query, "symptom", row.symptom);
  query = applyNullableFilter(query, "solution", row.solution);

  const { error } = await query;
  if (error) {
    throw error;
  }
}

async function main() {
  let processed = 0;

  while (true) {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("title, category, keywords, symptom, possible_cause, solution, source")
      .is("embedding", null)
      .limit(batchSize);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      const text = buildKnowledgeText(row);
      const embedding = await embedText(text);
      await updateEmbedding(row, embedding);
      processed += 1;
      console.log(`embedded ${processed}: ${row.title}`);
    }
  }

  console.log(`done: embedded ${processed} knowledge rows`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
