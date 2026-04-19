import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";

type LogModeRow = {
  analysis_mode: string | null;
  status: string | null;
};

type ErrorTypeRow = {
  error_type: string | null;
};

type AnalysisRow = {
  risk_level: string | null;
  analysis_mode: string | null;
  confidence: number | string | null;
};

function labelizeErrorType(value: string) {
  return toIssueTypeDisplayName(value);
}

function normalizeConfidence(value: number | string | null) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeAnalysisMode(value: string | null | undefined) {
  if (value === "rule_only" || value === "model_only" || value === "hybrid") {
    return value;
  }

  if (value === "rules_fast") return "rule_only";
  if (value === "summarized_hybrid") return "hybrid";
  if (value === "rule-only" || value === "rule") return "rule_only";
  if (value === "model-only" || value === "model") return "model_only";
  return "hybrid";
}

export function buildErrorTypeChart(errors: ErrorTypeRow[]) {
  const counts = new Map<string, number>();

  errors.forEach((error) => {
    const key = error.error_type ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([key, value]) => ({
      label: labelizeErrorType(key),
      value,
    }));
}

export function buildRiskChart(analyses: AnalysisRow[]) {
  const buckets = [
    { label: "High", key: "high", color: "#b45151" },
    { label: "Medium", key: "medium", color: "#9a7a2d" },
    { label: "Low", key: "low", color: "#2f6a9a" },
    { label: "Uncertain", key: "uncertain", color: "#4e7faa" },
  ] as const;

  return buckets
    .map((bucket) => ({
      label: bucket.label,
      value: analyses.filter((analysis) => {
        const riskLevel = analysis.risk_level ?? "uncertain";
        return riskLevel === bucket.key;
      }).length,
      color: bucket.color,
    }))
    .filter((bucket) => bucket.value > 0);
}

export function buildModeComparison(logs: LogModeRow[], analyses: AnalysisRow[]) {
  const modes = [
    { key: "rule_only", label: "Rule Only" },
    { key: "model_only", label: "Model Only" },
    { key: "hybrid", label: "Hybrid" },
  ] as const;

  return modes.map((mode) => {
    const modeLogs = logs.filter((log) => normalizeAnalysisMode(log.analysis_mode) === mode.key);
    const modeAnalyses = analyses.filter(
      (analysis) => normalizeAnalysisMode(analysis.analysis_mode) === mode.key,
    );
    const totalConfidence = modeAnalyses.reduce((sum, analysis) => {
      return sum + normalizeConfidence(analysis.confidence);
    }, 0);
    const avgConfidence =
      modeAnalyses.length > 0 ? totalConfidence / modeAnalyses.length : 0;

    return {
      mode: mode.label,
      tasks: modeLogs.length,
      findings: modeAnalyses.length,
      avgConfidence: Number((avgConfidence * 100).toFixed(1)),
    };
  });
}
