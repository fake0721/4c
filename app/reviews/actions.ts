"use server";

import { syncHistoricalMissedCase } from "@/lib/analysis/missed-case-library";
import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitReviewCaseAction(formData: FormData) {
  const returnPath = getTrimmedValue(formData, "returnPath") || "/dashboard/reviews";

  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", returnPath, "Supabase is not configured.");
  }

  const logErrorId = getTrimmedValue(formData, "logErrorId");
  const issueSpot = getTrimmedValue(formData, "issueSpot");
  const resolution = getTrimmedValue(formData, "resolution");
  const intent = getTrimmedValue(formData, "intent");
  const isSkip = intent === "skip";

  if (!logErrorId) {
    return encodedRedirect("error", returnPath, "Missing review target.");
  }

  if (!isSkip && !issueSpot && !resolution) {
    return encodedRedirect(
      "error",
      returnPath,
      "Fill in the issue spot or resolution, or choose skip.",
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "Please sign in before reviewing logs.");
  }

  const { data: logError, error: logErrorError } = await supabase
    .from("log_errors")
    .select("id, log_id, user_id, error_type")
    .eq("id", logErrorId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (logErrorError || !logError) {
    return encodedRedirect("error", returnPath, "The selected incident could not be found.");
  }

  const { data: existingReview, error: existingReviewError } = await supabase
    .from("review_cases")
    .select("id")
    .eq("log_error_id", logError.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingReviewError) {
    return encodedRedirect("error", returnPath, existingReviewError.message);
  }

  const payload = {
    reviewer_id: user.id,
    final_error_type: logError.error_type ?? null,
    final_cause: isSkip ? null : issueSpot || null,
    resolution: isSkip ? null : resolution || null,
    review_status: isSkip ? "skipped" : "completed",
    review_note: isSkip ? "Skipped by user." : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = existingReview
    ? await supabase
        .from("review_cases")
        .update(payload)
        .eq("id", existingReview.id)
        .eq("user_id", user.id)
    : await supabase.from("review_cases").insert({
        log_error_id: logError.id,
        log_id: logError.log_id,
        user_id: user.id,
        ...payload,
      });

  if (error) {
    return encodedRedirect("error", returnPath, error.message);
  }

  if (!isSkip) {
    await syncHistoricalMissedCase({
      supabase,
      logErrorId: logError.id,
      errorType: logError.error_type,
      rootCause: issueSpot,
      solution: resolution,
    });
  }

  return encodedRedirect(
    "success",
    returnPath,
    isSkip ? "Review skipped for this incident." : "Review saved successfully.",
  );
}
