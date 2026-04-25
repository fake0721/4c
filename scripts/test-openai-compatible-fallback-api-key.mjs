import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import ts from "typescript";

const require = createRequire(import.meta.url);
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const moduleCache = new Map();

function resolveProjectModule(specifier, parentDir) {
  if (specifier.startsWith("@/")) {
    return join(rootDir, `${specifier.slice(2)}.ts`);
  }

  if (specifier.startsWith(".")) {
    return resolve(parentDir, `${specifier}.ts`);
  }

  return null;
}

function loadTsModule(filePath) {
  if (moduleCache.has(filePath)) {
    return moduleCache.get(filePath).exports;
  }

  const source = readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const cjsModule = { exports: {} };
  moduleCache.set(filePath, cjsModule);

  const localRequire = (specifier) => {
    const projectModule = resolveProjectModule(specifier, dirname(filePath));
    return projectModule ? loadTsModule(projectModule) : require(specifier);
  };

  const run = new Function("require", "module", "exports", "__dirname", "__filename", output);
  run(localRequire, cjsModule, cjsModule.exports, dirname(filePath), filePath);

  return cjsModule.exports;
}

process.env.LLM_PROVIDER = "openai-compatible";
process.env.LLM_BASE_URL = "https://example.test/v1";
process.env.LLM_API_KEY = "primary-test-key";
process.env.LLM_FALLBACK_API_KEY = "fallback-test-key";
process.env.LLM_MODEL = "primary-model";
process.env.LLM_FALLBACK_MODEL = "fallback-model";
process.env.LLM_TIMEOUT_MS = "2000";

const requestAuthorizations = [];
const requestModels = [];

globalThis.fetch = async (_url, init) => {
  const headers = init?.headers ?? {};
  requestAuthorizations.push(headers.Authorization);

  const body = JSON.parse(String(init?.body ?? "{}"));
  requestModels.push(body.model);

  if (requestAuthorizations.length === 1) {
    return new Response(JSON.stringify({ error: "quota exhausted" }), { status: 429 });
  }

  return Response.json({
    choices: [
      {
        message: {
          content: JSON.stringify({
            cause: "主 key 不可用后已使用备用 key 完成分析。",
            riskLevel: "medium",
            confidence: 0.8,
            repairSuggestion: "检查主 key 额度并保留备用 key。",
          }),
        },
      },
    ],
    usage: {
      total_tokens: 42,
    },
  });
};

const { createOpenAiCompatibleProvider } = loadTsModule(
  join(rootDir, "lib/llm/providers/openai-compatible-provider.ts"),
);

const provider = createOpenAiCompatibleProvider();
const result = await provider.analyzeIncident({
  sourceType: "custom",
  logContent: "1: app connection refused",
  incident: {
    ruleId: "rule-1",
    ruleName: "connection refused",
    errorType: "network_error",
    riskLevel: "medium",
    lineNumber: 1,
    rawText: "app connection refused",
  },
  ragContext: [],
  analysisMode: "model_only",
});

assert.equal(result.model, "fallback-model");
assert.deepEqual(requestModels, ["primary-model", "fallback-model"]);
assert.deepEqual(requestAuthorizations, [
  "Bearer primary-test-key",
  "Bearer fallback-test-key",
]);
