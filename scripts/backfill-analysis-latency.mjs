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

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const onlyUserIdArg = argv.find((item) => item.startsWith("--user="));
  const batchSizeArg = argv.find((item) => item.startsWith("--batch="));

  const onlyUserId = onlyUserIdArg ? onlyUserIdArg.slice("--user=".length).trim() : "";
  const parsedBatchSize = batchSizeArg ? Number.parseInt(batchSizeArg.slice("--batch=".length), 10) : NaN;
  const batchSize = Number.isFinite(parsedBatchSize) && parsedBatchSize > 0
    ? Math.min(parsedBatchSize, 2000)
    : 500;

  return {
    dryRun,
    onlyUserId,
    batchSize,
  };
}

function estimateLatencyMs(rawText) {
  const textLength = typeof rawText === "string" ? rawText.length : 0;
  const estimated = Math.round(textLength / 80) + 1;
  return Math.max(1, Math.min(estimated, 120));
}

loadLocalEnv();

const options = parseArgs(process.argv.slice(2));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function fetchPendingRows(batchSize, onlyUserId) {
  let query = supabase
    .from("analysis_results")
    .select("id, user_id, log_error_id, model_name, latency_ms")
    .eq("model_name", "rule-engine-v1")
    .is("latency_ms", null)
    .limit(batchSize);

  if (onlyUserId) {
    query = query.eq("user_id", onlyUserId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchErrorTextById(errorIds) {
  if (errorIds.length === 0) {
    return new Map();
  }

  const chunkSize = 1000;
  const result = new Map();

  for (let i = 0; i < errorIds.length; i += chunkSize) {
    const chunk = errorIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("log_errors")
      .select("id, raw_text")
      .in("id", chunk);

    if (error) {
      throw error;
    }

    for (const row of data ?? []) {
      result.set(String(row.id), typeof row.raw_text === "string" ? row.raw_text : "");
    }
  }

  return result;
}

async function updateLatency(id, latencyMs) {
  const { error } = await supabase
    .from("analysis_results")
    .update({ latency_ms: latencyMs })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function main() {
  let totalScanned = 0;
  let totalUpdated = 0;

  while (true) {
    const pendingRows = await fetchPendingRows(options.batchSize, options.onlyUserId);

    if (pendingRows.length === 0) {
      break;
    }

    totalScanned += pendingRows.length;

    const errorIds = pendingRows
      .map((item) => String(item.log_error_id ?? "").trim())
      .filter(Boolean);

    const textByErrorId = await fetchErrorTextById(errorIds);

    for (const row of pendingRows) {
      const errorId = String(row.log_error_id ?? "").trim();
      const rawText = textByErrorId.get(errorId) ?? "";
      const latencyMs = estimateLatencyMs(rawText);

      if (!options.dryRun) {
        await updateLatency(row.id, latencyMs);
      }

      totalUpdated += 1;
    }

    console.log(
      `${options.dryRun ? "[dry-run]" : "[applied]"} batch rows=${pendingRows.length}, total=${totalUpdated}`,
    );

    if (pendingRows.length < options.batchSize) {
      break;
    }
  }

  console.log(
    `${options.dryRun ? "dry-run done" : "done"}: scanned=${totalScanned}, updated=${totalUpdated}, user=${options.onlyUserId || "all"}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
