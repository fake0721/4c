export type ReviewCaseSnapshot = {
  finalErrorType: string | null;
  finalRiskLevel: string | null;
  reviewNote: string | null;
  updatedAt: string | null;
};

export type ReviewCaseRevisionSummary = {
  createdAt: string;
  beforeSnapshot: ReviewCaseSnapshot;
  afterSnapshot: ReviewCaseSnapshot;
  typeChangeText: string;
  riskChangeText: string;
  noteChanged: boolean;
  noteChangeLabel: string;
};

type ReviewCaseRowLike = Record<string, unknown> & {
  final_error_type?: unknown;
  finalErrorType?: unknown;
  final_risk_level?: unknown;
  finalRiskLevel?: unknown;
  review_note?: unknown;
  reviewNote?: unknown;
  updated_at?: unknown;
  updatedAt?: unknown;
};

function toNullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeIsoTimestamp(value: unknown) {
  const text = toNullableString(value);
  if (!text) {
    return null;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

function toIsoTimestampOrText(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  return normalizeIsoTimestamp(value);
}

function formatValue(value: string | null) {
  return value ?? "unset";
}

function formatChangeText(beforeValue: string | null, afterValue: string | null) {
  if (beforeValue === afterValue) {
    return `unchanged (${formatValue(afterValue)})`;
  }

  return `from ${formatValue(beforeValue)} to ${formatValue(afterValue)}`;
}

export function buildReviewCaseSnapshot(reviewCaseRow: ReviewCaseRowLike): ReviewCaseSnapshot {
  return {
    finalErrorType: toNullableString(reviewCaseRow.final_error_type ?? reviewCaseRow.finalErrorType),
    finalRiskLevel: toNullableString(reviewCaseRow.final_risk_level ?? reviewCaseRow.finalRiskLevel),
    reviewNote: toNullableString(reviewCaseRow.review_note ?? reviewCaseRow.reviewNote),
    updatedAt: normalizeIsoTimestamp(reviewCaseRow.updated_at ?? reviewCaseRow.updatedAt),
  };
}

export function summarizeReviewCaseRevision(
  beforeSnapshot: ReviewCaseSnapshot,
  afterSnapshot: ReviewCaseSnapshot,
  createdAt: string | Date,
): ReviewCaseRevisionSummary {
  const normalizedCreatedAt =
    toIsoTimestampOrText(createdAt) ?? String(createdAt);
  const noteChanged = beforeSnapshot.reviewNote !== afterSnapshot.reviewNote;

  return {
    createdAt: normalizedCreatedAt,
    beforeSnapshot,
    afterSnapshot,
    typeChangeText: formatChangeText(beforeSnapshot.finalErrorType, afterSnapshot.finalErrorType),
    riskChangeText: formatChangeText(beforeSnapshot.finalRiskLevel, afterSnapshot.finalRiskLevel),
    noteChanged,
    noteChangeLabel: noteChanged ? "note updated" : "note unchanged",
  };
}
