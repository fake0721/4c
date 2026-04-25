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

const { detectLogIncidents } = loadTsModule(join(rootDir, "lib/rules/engine.ts"));

const invalidRegexRule = {
  id: "invalid-regex-rule",
  name: "Invalid Regex Rule",
  pattern: "[",
  matchType: "regex",
  errorType: "unknown_error",
  riskLevel: "low",
  enabled: true,
};

const validKeywordRule = {
  id: "valid-keyword-rule",
  name: "Valid Keyword Rule",
  pattern: "connection refused",
  matchType: "keyword",
  errorType: "network_error",
  riskLevel: "high",
  enabled: true,
};

const incidents = detectLogIncidents(
  "2026-04-25 app error: connection refused",
  "custom",
  [invalidRegexRule, validKeywordRule],
  { includeDefaultRules: false },
);

assert.equal(incidents.length, 1);
assert.equal(incidents[0].ruleId, "valid-keyword-rule");
