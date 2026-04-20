"use client";

import { useEffect, useMemo, useState } from "react";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";
import { ReviewDetail } from "@/components/dashboard/pages/reviews/review-detail";
import { ReviewQueue } from "@/components/dashboard/pages/reviews/review-queue";
import type { ReviewItem, ReviewsPageData } from "@/lib/dashboard/reviews";

type ReviewsPageProps = {
  data: ReviewsPageData;
  initialActiveId?: string;
};

type ReviewFormState = {
  issueTypeValue: string;
  riskValue: string;
  reviewNote: string;
};

function createInitialForms(items: ReviewItem[]) {
  return items.reduce<Record<string, ReviewFormState>>((accumulator, item) => {
    accumulator[item.id] = {
      issueTypeValue: item.issueTypeValue,
      riskValue: item.riskValue,
      reviewNote: item.reviewNote,
    };
    return accumulator;
  }, {});
}

function toRiskLabel(riskValue: string) {
  if (riskValue === "high") return "高风险";
  if (riskValue === "low") return "低风险";
  return "中风险";
}

export function ReviewsPage({ data, initialActiveId }: ReviewsPageProps) {
  const initialItems = [...data.queue, ...data.historyCases];
  const normalizedInitialActiveId =
    initialActiveId && initialItems.some((item) => item.id === initialActiveId)
      ? initialActiveId
      : null;

  const [queue, setQueue] = useState(data.queue);
  const [historyCases, setHistoryCases] = useState(data.historyCases);
  const [activeId, setActiveId] = useState<string | null>(normalizedInitialActiveId ?? data.queue[0]?.id ?? data.historyCases[0]?.id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<string, ReviewFormState>>(
    createInitialForms([...data.queue, ...data.historyCases]),
  );

  const allItems = useMemo(() => [...queue, ...historyCases], [historyCases, queue]);
  const activeItem = useMemo(
    () => allItems.find((item) => item.id === activeId) ?? queue[0] ?? historyCases[0] ?? null,
    [activeId, allItems, historyCases, queue],
  );
  const activeIndex = useMemo(
    () => (activeItem ? Math.max(0, queue.findIndex((item) => item.id === activeItem.id)) : -1),
    [activeItem, queue],
  );
  const activeForm = activeItem
    ? reviewForms[activeItem.id] ?? {
        issueTypeValue: activeItem.issueTypeValue,
        riskValue: activeItem.riskValue,
        reviewNote: activeItem.reviewNote,
      }
    : null;

  useEffect(() => {
    if (!activeItem && (queue[0] || historyCases[0])) {
      setActiveId(queue[0]?.id ?? historyCases[0]?.id ?? null);
    }
  }, [activeItem, historyCases, queue]);

  useEffect(() => {
    if (!initialActiveId) {
      return;
    }

    const exists = allItems.some((item) => item.id === initialActiveId);
    if (exists) {
      setActiveId(initialActiveId);
    }
  }, [allItems, initialActiveId]);

  function handleSelectReview(id: string) {
    setActiveId(id);
  }

  function updateActiveForm(patch: Partial<ReviewFormState>) {
    if (!activeItem) {
      return;
    }

    setReviewForms((current) => ({
      ...current,
      [activeItem.id]: {
        issueTypeValue: current[activeItem.id]?.issueTypeValue ?? activeItem.issueTypeValue,
        riskValue: current[activeItem.id]?.riskValue ?? activeItem.riskValue,
        reviewNote: current[activeItem.id]?.reviewNote ?? activeItem.reviewNote,
        ...patch,
      },
    }));
  }

  async function handleConfirmNext() {
    if (!activeItem || activeItem.reviewStatus !== "pending" || isSubmitting) {
      return;
    }

    const form = reviewForms[activeItem.id] ?? {
      issueTypeValue: activeItem.issueTypeValue,
      riskValue: activeItem.riskValue,
      reviewNote: activeItem.reviewNote,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/inner-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "complete-review",
          reviewCaseId: activeItem.id,
          finalErrorType: form.issueTypeValue,
          finalRiskLevel: form.riskValue,
          reviewNote: form.reviewNote,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "复核更新失败，请稍后重试。");
      }

      setToastMessage("复盘已保存，已自动进入下一条。");
      window.setTimeout(() => setToastMessage(null), 1800);
      setExitingId(activeItem.id);

      const completedAt = new Date().toISOString();
      const finalizedTitle = toIssueTypeDisplayName(form.issueTypeValue);
      const finalizedRiskLabel = toRiskLabel(form.riskValue);

      const completedItem: ReviewItem = {
        ...activeItem,
        title: finalizedTitle,
        issueTypeValue: form.issueTypeValue,
        riskValue: form.riskValue,
        riskLabel: finalizedRiskLabel,
        reviewNote: form.reviewNote,
        reviewStatus: "completed",
        updatedAt: completedAt,
      };

      window.setTimeout(() => {
        const remainingQueue = queue.filter((item) => item.id !== activeItem.id);
        const nextIndex = activeIndex >= 0 ? Math.min(activeIndex, Math.max(remainingQueue.length - 1, 0)) : 0;
        setQueue(remainingQueue);
        setHistoryCases((current) => [completedItem, ...current]);
        setReviewForms((current) => ({
          ...current,
          [completedItem.id]: {
            issueTypeValue: form.issueTypeValue,
            riskValue: form.riskValue,
            reviewNote: form.reviewNote,
          },
        }));
        setActiveId(remainingQueue[nextIndex]?.id ?? completedItem.id);
        setExitingId(null);
      }, 220);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex h-[calc(100vh-9rem)] min-h-[calc(100vh-9rem)] overflow-hidden rounded-[24px] border border-[#CBD7E4] bg-[#F3F5F8] shadow-[0_12px_30px_rgba(31,42,55,0.08)]">
      <ReviewQueue
        queue={queue}
        activeId={activeItem?.id ?? null}
        activeIndex={activeIndex}
        exitingId={exitingId}
        onSelect={handleSelectReview}
      />
      <ReviewDetail
        item={activeItem}
        historyCases={historyCases}
        queueLength={queue.length}
        onSelectHistoryCase={handleSelectReview}
        onConfirmNext={handleConfirmNext}
        isSubmitting={isSubmitting}
        issueTypeValue={activeForm?.issueTypeValue ?? activeItem?.issueTypeValue ?? ""}
        riskValue={activeForm?.riskValue ?? activeItem?.riskValue ?? "medium"}
        reviewNote={activeForm?.reviewNote ?? activeItem?.reviewNote ?? ""}
        onIssueTypeChange={(value) => updateActiveForm({ issueTypeValue: value })}
        onRiskChange={(value) => updateActiveForm({ riskValue: value })}
        onReviewNoteChange={(value) => updateActiveForm({ reviewNote: value })}
      />
      {toastMessage ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50/95 px-4 py-2 text-sm font-medium text-emerald-700 shadow-[0_8px_22px_rgba(16,185,129,0.18)]">
          {toastMessage}
        </div>
      ) : null}
    </section>
  );
}
