import { ReviewsPage } from "@/components/dashboard/pages/reviews/reviews-page";
import { getReviewsPageData } from "@/lib/dashboard/reviews";

type DashboardReviewsPageProps = {
  searchParams?: Promise<{
    reviewCaseId?: string;
  }>;
};

export default async function DashboardReviewsPage({ searchParams }: DashboardReviewsPageProps) {
  const params = (await searchParams) ?? {};
  const initialReviewCaseId = typeof params.reviewCaseId === "string" ? params.reviewCaseId.trim() : "";
  const data = await getReviewsPageData();

  return <ReviewsPage data={data} initialActiveId={initialReviewCaseId || undefined} />;
}
