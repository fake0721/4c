"use client";

import { useMemo, useState } from "react";
import { AnalysesFilters } from "@/components/dashboard/pages/analyses/analyses-filters";
import { AnalysesTable } from "@/components/dashboard/pages/analyses/analyses-table";
import type { AnalysesPageData } from "@/lib/dashboard/analyses";

type AnalysesPageProps = {
  data: AnalysesPageData;
};

const PAGE_SIZE = 8;

export function AnalysesPage({ data }: AnalysesPageProps) {
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [riskFilter, setRiskFilter] = useState("全部风险");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    return data.rows.filter((row) => {
      const statusMatch = statusFilter === "全部状态" || row.statusLabel === statusFilter;
      const riskMatch = riskFilter === "全部风险" || row.riskLabel === riskFilter;
      const keywordMatch = keyword.trim().length === 0 || String(row.fileName ?? "").toLowerCase().includes(keyword.trim().toLowerCase());
      return statusMatch && riskMatch && keywordMatch;
    });
  }, [data.rows, keyword, riskFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function updateStatus(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function updateRisk(value: string) {
    setRiskFilter(value);
    setCurrentPage(1);
  }

  function updateKeyword(value: string) {
    setKeyword(value);
    setCurrentPage(1);
  }

  const start = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 font-headline text-4xl font-black tracking-tight text-[#1F2A37]">分析记录</h1>
          <p className="text-sm text-[#5F6B7A]">查看与管理系统日志的历史分析任务</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#DECDB6] bg-[#F4FFFB] px-4 py-2 text-[11px] font-label uppercase tracking-[0.24em] text-[#7A6E63] shadow-[0_6px_18px_rgba(31,59,53,0.04)]">
          <span>总记录 {data.total}</span>
          <span className="text-[#C3B39E]">?</span>
          <span>待复核 {data.pendingReviewCount}</span>
        </div>
      </div>

      <AnalysesFilters
        statusFilter={statusFilter}
        riskFilter={riskFilter}
        keyword={keyword}
        onStatusChange={updateStatus}
        onRiskChange={updateRisk}
        onKeywordChange={updateKeyword}
      />

      <section className="glass-panel overflow-hidden rounded-[26px] border border-[#DCE4EE] shadow-[0_12px_30px_rgba(31,59,53,0.06)]">
        <AnalysesTable rows={pagedRows} />

        <div className="flex flex-col gap-4 border-t border-[#DCE4EE] bg-[#F4FFFB] px-6 py-4 md:flex-row md:items-center md:justify-between">
          <span className="font-label text-[11px] uppercase tracking-[0.24em] text-[#7A6E63]">{`显示第 ${start} 到 ${end} 条，共 ${filteredRows.length} 条记录`}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD7E4] bg-white/40 text-[#5F6B7A] transition-all hover:bg-[#E9EDF3] disabled:opacity-40"
              disabled={safePage <= 1}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).slice(Math.max(0, safePage - 2), Math.max(0, safePage - 2) + 3).map((_, index) => {
              const page = Math.max(1, safePage - 1) + index;
              if (page > totalPages) return null;
              const active = page === safePage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={
                    active
                      ? "flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#1F4E79] px-3 font-bold text-white shadow-[0_8px_18px_rgba(31,78,121,0.24)]"
                      : "flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#CBD7E4] bg-white/30 px-3 text-[#5F6B7A] transition-all hover:bg-[#E9EDF3]"
                  }
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD7E4] bg-white/40 text-[#5F6B7A] transition-all hover:bg-[#E9EDF3] disabled:opacity-40"
              disabled={safePage >= totalPages}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
