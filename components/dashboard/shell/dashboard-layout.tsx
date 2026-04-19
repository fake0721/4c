"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/shell/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/shell/dashboard-topbar";

type DashboardLayoutProps = {
  userEmail: string;
  teamName: string | null;
  avatarUrl: string | null;
  pendingReviewCount: number;
  children: React.ReactNode;
};

const MIGRATED_PATHS = new Set(["/dashboard", "/upload", "/dashboard/reviews", "/dashboard/high-risk", "/dashboard/analyses", "/dashboard/account", "/dashboard/tasks", "/dashboard/history-cases", "/dashboard/knowledge", "/dashboard/incidents", "/dashboard/rules", "/dashboard/settings", "/dashboard/performance", "/dashboard/help", "/dashboard/docs"]);

export function DashboardLayout({ avatarUrl, pendingReviewCount, children }: DashboardLayoutProps) {
  const pathname = usePathname();

  if (!MIGRATED_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-mocha-surface min-h-screen bg-[#F3F5F8] p-4 font-body text-[#1F2A37] md:p-6">
      <section className="relative mx-auto min-h-[calc(100vh-2rem)] w-full max-w-[1800px] overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_20px_56px_rgba(31,59,53,0.14)] md:min-h-[calc(100vh-3rem)]">
        <div className="relative min-h-[calc(100vh-2rem)] bg-[#F3F5F8] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] md:min-h-[calc(100vh-3rem)]">
          <DashboardSidebar />
          <DashboardTopbar avatarUrl={avatarUrl} pendingReviewCount={pendingReviewCount} />
          <main className="min-h-[calc(100vh-2rem)] px-8 pb-12 pt-24 md:min-h-[calc(100vh-3rem)] md:pl-72 md:pr-8">
            {children}
          </main>
        </div>
      </section>
    </div>
  );
}

