import { ReviewsPage } from "@/components/dashboard/pages/reviews/reviews-page";
import { getReviewsPageData } from "@/lib/dashboard/reviews";

export default async function DashboardReviewsPage() {
  const data = await getReviewsPageData();

  return <ReviewsPage data={data} />;
}
