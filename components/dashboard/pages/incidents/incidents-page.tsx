"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { IncidentRow, IncidentsPageData } from "@/lib/dashboard/incidents";

type IncidentsPageProps = {
  data: IncidentsPageData;
};

const PAGE_SIZE = 8;

export function IncidentsPage({ data }: IncidentsPageProps) {
  const [riskFilter, setRiskFilter] = useState("全部等级");
  const [typeFilter, setTypeFilter] = useState("所有类型");
  const [reviewFilter, setReviewFilter] = useState("不限");
  const [stageFilter, setStageFilter] = useState("全部阶段");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const typeOptions = useMemo(() => {
    return ["所有类型", ...Array.from(new Set(data.rows.map((item) => item.type).filter(Boolean)))];
  }, [data.rows]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return data.rows.filter((row) => {
      const riskMatch = riskFilter === "全部等级" || row.riskLabel === riskFilter;
      const typeMatch = typeFilter === "所有类型" || row.type === typeFilter;
      const reviewMatch = reviewFilter === "不限" || (reviewFilter === "是" ? row.stageLabel === "待复核" : row.stageLabel !== "待复核");
      const stageMatch = stageFilter === "全部阶段" || (stageFilter === "待处理" ? row.stageLabel === "待复核" : row.stageLabel === stageFilter);
      const keywordMatch = normalizedKeyword.length === 0 || row.sourceLog.toLowerCase().includes(normalizedKeyword) || row.title.toLowerCase().includes(normalizedKeyword);

      return riskMatch && typeMatch && reviewMatch && stageMatch && keywordMatch;
    });
  }, [data.rows, keyword, reviewFilter, riskFilter, stageFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-[#1F2A37]">问题中心</h1>
            <p className="text-sm text-[#5F6B7A]">集中管理系统异常，基于系统的根因识别与处理建议。</p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#1F4E79]/20 bg-[#1F4E79]/10 px-3 py-1 text-[10px] font-label uppercase tracking-widest text-[#1F4E79]">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>
                bolt
              </span>
              <span>仅展示待处理与处理中问题</span>
            </div>
          </div>
          <Link
            href="/dashboard/reviews"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F4E79]/15 px-5 py-2.5 text-sm font-bold text-[#1F4E79] transition-all hover:bg-[#1F4E79]/25"
          >
            <span className="material-symbols-outlined text-base">support_agent</span>
            进入人工复核
          </Link>
        </div>
      </header>

      <section className="glass-panel mb-8 rounded-2xl border border-[#DCE4EE] p-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[repeat(4,minmax(0,160px))_minmax(0,1fr)_auto]">
          <FilterSelect label="风险等级" value={riskFilter} onChange={setRiskFilter} options={["全部等级", "高风险", "中风险", "低风险"]} />
          <FilterSelect label="问题类型" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
          <FilterSelect label="待复核" value={reviewFilter} onChange={setReviewFilter} options={["不限", "是", "否"]} />
          <FilterSelect label="处理阶段" value={stageFilter} onChange={setStageFilter} options={["全部阶段", "待处理", "处理中", "待复核", "已完成", "已跳过"]} />
          <div className="flex flex-col gap-1.5">
            <label className="px-1 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">文件名搜索</label>
            <div className="relative">
              <input
                type="text"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="输入日志文件名..."
                className="w-full rounded-lg border-none bg-[#DCE4EE] py-2 pl-3 pr-10 text-xs text-[#1F2A37] outline-none focus:ring-1 focus:ring-[#1F4E79]/20"
              />
              <span className="material-symbols-outlined absolute right-3 top-2 text-sm text-[#7B8898]">find_in_page</span>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="rounded-lg bg-[#F4FFFB] p-2 text-[#1F4E79] transition-all hover:bg-[#F3EBDD]"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>
      </section>

      <section className="glass-panel overflow-hidden rounded-2xl border border-[#DCE4EE] shadow-[0_12px_30px_rgba(31,59,53,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DCE4EE] bg-[#F4FFFB]">
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">问题名称</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">来源日志</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">异常类型</th>
                <th className="px-6 py-4 text-center font-label text-[10px] uppercase tracking-widest text-[#7B8898]">风险等级</th>
                <th className="px-6 py-4 text-center font-label text-[10px] uppercase tracking-widest text-[#7B8898]">处理阶段</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">建议动作</th>
                <th className="px-6 py-4 text-right font-label text-[10px] uppercase tracking-widest text-[#7B8898]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCCB]">
              {pagedRows.length > 0 ? (
                pagedRows.map((row) => <IncidentTableRow key={row.id} row={row} />)
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#7B8898]">
                    当前筛选条件下没有匹配的问题记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#DCE4EE] bg-[#F4FFFB] px-6 py-4 md:flex-row md:items-center md:justify-between">
          <span className="font-label text-[11px] uppercase tracking-[0.24em] text-[#7A6E63]">{`显示 ${start} 到 ${end} 共 ${filteredRows.length} 个异常问题`}</span>
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

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="glass-panel relative overflow-hidden rounded-2xl border border-[#DCE4EE] p-6 md:col-span-2">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#1F4E79]/10 blur-[60px]" />
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1F2A37]">
            <span className="material-symbols-outlined text-[#1F4E79]">auto_fix_high</span>
            系统处理建议趋势
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-[#1F4E79]" />
              <div className="flex-1 text-sm text-[#5F6B7A]">
                近 7 天共生成 <span className="font-bold text-[#1F4E79]">{data.suggestionTrend.reduce((sum, item) => sum + item.count, 0)}</span> 条处理建议，
                单日最高 <span className="font-bold text-[#1F4E79]">{Math.max(...data.suggestionTrend.map((item) => item.count), 0)}</span> 条。
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-[#3A6A9A]" />
              <div className="flex-1 text-sm text-[#5F6B7A]">
                建议关注高频异常类型并优先进入人工复核，及时确认根因与修复动作。
              </div>
            </div>
          </div>
          <div className="mt-6 flex h-28 items-end gap-2">
            {data.suggestionTrend.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={index === data.suggestionTrend.length - 1 ? "w-full rounded-t-sm bg-[#1F4E79] shadow-[0_-8px_18px_rgba(31,78,121,0.22)]" : "w-full rounded-t-sm bg-[#1F4E79]/35"}
                  style={{ height: `${item.heightPercent}%` }}
                  title={`${item.label}：${item.count} 条`}
                />
                <span className="font-label text-[9px] uppercase tracking-widest text-[#7B8898]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel flex flex-col justify-between rounded-2xl border border-[#DCE4EE] p-6">
          <div>
            <div className="mb-1 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">今日复核效率</div>
            <div className="font-headline text-3xl font-bold text-[#1F2A37]">
              {data.reviewEfficiency.todayTotal > 0 ? `${data.reviewEfficiency.percent}%` : "--%"}
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full overflow-hidden rounded-full bg-[#DCE4EE]">
              <div className="h-full bg-gradient-to-r from-[#1F4E79] via-[#2F5F8E] to-[#6B4422]" style={{ width: `${data.reviewEfficiency.percent}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-[#7B8898]">
              <span>{`已复核: ${data.reviewEfficiency.todayReviewed}`}</span>
              <span>{`待复核: ${Math.max(0, data.reviewEfficiency.todayTotal - data.reviewEfficiency.todayReviewed)}`}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="px-1 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none rounded-lg border-none bg-[#DCE4EE] py-2 pl-3 pr-8 text-xs text-[#1F2A37] outline-none focus:ring-1 focus:ring-[#1F4E79]/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function IncidentTableRow({ row }: { row: IncidentRow }) {
  const highRisk = row.riskLabel === "高风险";
  const mediumRisk = row.riskLabel === "中风险";
  const done = row.stageLabel === "已完成";
  const skipped = row.stageLabel === "已跳过";

  return (
    <tr className="group transition-colors hover:bg-[#F4FFFB]">
      <td className="px-6 py-5">
        <div className="font-semibold text-sm text-[#1F2A37]">{row.title}</div>
        <div className="mt-1 font-label text-[10px] text-[#7B8898]">ID: {row.id}</div>
      </td>
      <td className="px-6 py-5 text-sm text-[#5F6B7A]">{row.sourceLog}</td>
      <td className="px-6 py-5">
        <span className="rounded bg-[#DCE4EE] px-2 py-1 text-[11px] text-[#5F6B7A]">{row.type}</span>
      </td>
      <td className="px-6 py-5 text-center">
        <span
          className={
            highRisk
              ? "inline-flex items-center gap-1.5 rounded-full bg-[#FF8C00]/20 px-3 py-1 text-[10px] font-bold uppercase text-[#FF8C00] ring-1 ring-[#FF8C00]/50"
              : mediumRisk
                ? "inline-flex items-center gap-1.5 rounded-full bg-[#FFD700]/20 px-3 py-1 text-[10px] font-bold uppercase text-[#A27C00] ring-1 ring-[#FFD700]/50"
                : "inline-flex items-center gap-1.5 rounded-full bg-[#E3F0FF] px-3 py-1 text-[10px] font-bold uppercase text-[#2D6DAD] ring-1 ring-[#9CC2E8]"
          }
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {row.riskLabel}
        </span>
      </td>
      <td className="px-6 py-5 text-center">
        <span
          className={
            done
              ? "inline-flex items-center rounded-full bg-[#E8F4EC] px-3 py-1 text-[10px] font-bold text-[#2F6A42] ring-1 ring-[#BFDDC9]"
              : skipped
                ? "inline-flex items-center rounded-full bg-[#E9EDF3] px-3 py-1 text-[10px] font-bold text-[#7B8898] ring-1 ring-[#CBD7E4]"
                : "inline-flex items-center rounded-full bg-[#FFF5DE] px-3 py-1 text-[10px] font-bold text-[#8A6A24] ring-1 ring-[#E8D3A1]"
          }
        >
          {row.stageLabel}
        </span>
      </td>
      <td className="px-6 py-5 text-sm italic text-[#1F4E79]">{row.suggestion}</td>
      <td className="px-6 py-5 text-right">
        <div className="flex justify-end gap-2">
          <Link
            href="/dashboard/reviews"
            className="rounded bg-[#E9EDF3] px-3 py-1 text-[10px] font-bold uppercase text-[#5F6B7A] transition-all hover:bg-[#DCE4EE]"
          >
            详情
          </Link>
          <Link
            href="/dashboard/reviews"
            className={
              done
                ? "pointer-events-none cursor-not-allowed rounded bg-[#E9EDF3] px-3 py-1 text-[10px] font-bold uppercase text-[#97A4B2]"
                : "rounded bg-[#1F4E79]/20 px-3 py-1 text-[10px] font-bold uppercase text-[#1F4E79] transition-all hover:bg-[#1F4E79]/35"
            }
          >
            {done ? "已处理" : "立即处理"}
          </Link>
        </div>
      </td>
    </tr>
  );
}
