"use client";

import { useEffect, useMemo, useState } from "react";
import { toIssueTypeDisplayName } from "@/lib/labels/issue-type";
import { ReviewDetail } from "@/components/dashboard/pages/reviews/review-detail";
import { ReviewQueue } from "@/components/dashboard/pages/reviews/review-queue";
import type { ReviewItem, ReviewsPageData } from "@/lib/dashboard/reviews";

type ReviewsPageProps = {
  data: ReviewsPageData;
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

export function ReviewsPage({ data }: ReviewsPageProps) {
  const [queue, setQueue] = useState(data.queue);
  const [historyCases, setHistoryCases] = useState(data.historyCases);
  const [activeId, setActiveId] = useState<string | null>(data.queue[0]?.id ?? data.historyCases[0]?.id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

      const completedItem: ReviewItem = {
        ...activeItem,
        title: toIssueTypeDisplayName(form.issueTypeValue),
        issueTypeValue: form.issueTypeValue,
        riskValue: form.riskValue,
        riskLabel: toRiskLabel(form.riskValue),
        reviewNote: form.reviewNote,
        reviewStatus: "completed",
        updatedAt: new Date().toISOString(),
      };
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
    </section>
  );
}
