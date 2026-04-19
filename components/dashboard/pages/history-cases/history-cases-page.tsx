"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { HistoryCaseRow, HistoryCasesPageData } from "@/lib/dashboard/history-cases";

type HistoryCasesPageProps = {
  data: HistoryCasesPageData;
};

const PAGE_SIZE = 12;

export function HistoryCasesPage({ data }: HistoryCasesPageProps) {
  const router = useRouter();
  const [riskFilter, setRiskFilter] = useState("全部级别");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const typeOptions = useMemo(() => ["全部类型", ...Array.from(new Set(data.rows.map((item) => item.typeLabel)))], [data.rows]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return data.rows.filter((row) => {
      const riskMatch = riskFilter === "全部级别" || row.riskLabel === riskFilter;
      const typeMatch = typeFilter === "全部类型" || row.typeLabel === typeFilter;
      const statusMatch = statusFilter === "全部状态" || row.reviewStatusLabel === statusFilter;
      const keywordMatch =
        normalizedKeyword.length === 0 ||
        row.title.toLowerCase().includes(normalizedKeyword) ||
        row.sourceLog.toLowerCase().includes(normalizedKeyword) ||
        row.incidentId.toLowerCase().includes(normalizedKeyword) ||
        row.snippet.toLowerCase().includes(normalizedKeyword);
      return riskMatch && typeMatch && statusMatch && keywordMatch;
    });
  }, [data.rows, keyword, riskFilter, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  return (
    <div className="mx-auto w-full max-w-7xl text-[#1F2A37]">
      <header className="mb-10">
        <div>
          <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tight">历史问题库</h1>
          <p className="max-w-3xl text-sm leading-7 text-[#5F6B7A]">聚合已关闭问题的历史复盘记录，支持按归档状态、风险和根因路径检索，沉淀可复用经验。</p>
        </div>
      </header>

      <section className="glass-panel mb-8 rounded-2xl border border-[#DCE4EE] p-4 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">历史与知识页面导航</p>
            <p className="mt-1 text-xs text-[#7B8898]">进入页面后即可直接判断当前所在位置，并在三页之间切换。</p>
          </div>
          <span className="hidden text-[10px] text-[#97A4B2] md:inline">三页统一工作流入口</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link href="/dashboard/tasks" className="rounded-xl border border-[#DCE4EE] bg-white/30 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]">历史日志存档</Link>
          <button type="button" aria-current="page" className="rounded-xl border border-[#1F4E79]/40 bg-gradient-to-r from-[#1F4E79]/22 via-[#D7B389]/12 to-transparent px-4 py-3 text-center text-sm font-bold text-[#1F4E79] shadow-[0_10px_22px_rgba(31,78,121,0.12)]">
            历史问题库
            <span className="ml-2 inline-flex rounded-full bg-[#1F4E79]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#1F4E79]">当前</span>
          </button>
          <Link href="/dashboard/knowledge" className="rounded-xl border border-[#DCE4EE] bg-white/30 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]">探索根因知识库</Link>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsMetricCard label="待复核" value={data.historicalMissedOps.pendingReviews} tone="text-[#1F4E79]" hint="当前还未完成人工复核的案例数" />
        <OpsMetricCard label="已复核" value={data.historicalMissedOps.completedReviews} tone="text-[#5F6B7A]" hint="已经完成复核、可继续判断是否沉淀的案例数" />
        <OpsMetricCard label="可回补" value={data.historicalMissedOps.backfillEligibleReviews} tone="text-[#3A6A9A]" hint="已具备根因或方案，可回补进漏报库的案例数" />
        <OpsMetricCard label="漏报库条目" value={data.historicalMissedOps.historicalMissedTotal} tone="text-[#6A8F61]" hint={`已人工确认 ${data.historicalMissedOps.verifiedHistoricalMissedTotal} 条`} />
      </section>

      <section className="mb-8 grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-2xl border border-[#DCE4EE] p-6 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">漏报库运营状态</p>
              <h2 className="mt-2 text-xl font-bold text-[#1F2A37]">历史漏报闭环已接通，等待真实复核数据进入</h2>
            </div>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#CBD7E4] bg-[#F4FFFB] text-[#1F4E79] transition hover:border-[#C9AE86] hover:bg-[#F2E7D7]"
              aria-label="刷新漏报库运营状态"
              title="刷新漏报库运营状态"
            >
              <span className="material-symbols-outlined text-2xl">cycle</span>
            </button>
          </div>
          <div className="mt-4 space-y-2 text-sm leading-7 text-[#5F6B7A]">
            <p>{data.historicalMissedOps.completedReviews > 0 ? `当前已有 ${data.historicalMissedOps.completedReviews} 条复核完成，其中 ${data.historicalMissedOps.backfillEligibleReviews} 条具备漏报回补条件。` : "当前还没有 completed review，所以漏报库还不会自动长数据。"}</p>
            <p>{data.historicalMissedOps.historicalMissedTotal > 0 ? `漏报库目前已有 ${data.historicalMissedOps.historicalMissedTotal} 条，可在后续同类问题中优先召回。` : "一旦开始完成真实复核，系统就会自动尝试把根因与方案沉淀进 historical_missed_cases。"}</p>
          </div>

          <div className="mt-6 rounded-2xl border border-[#E8DCCB] bg-[#F4FFFB] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">最近可回补案例</p>
                <p className="mt-1 text-xs text-[#7B8898]">这些复核结果已经具备沉淀到漏报库的条件。</p>
              </div>
              <span className="material-symbols-outlined text-xl text-[#1F4E79]">playlist_add_check</span>
            </div>
            {data.recentBackfillCases.length > 0 ? (
              <div className="space-y-2">
                {data.recentBackfillCases.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/60 bg-white/70 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1F2A37]">{item.title}</p>
                        <p className="mt-1 text-xs text-[#7B8898]">{item.sourceLog}</p>
                      </div>
                      <span className="rounded-full bg-[#E9EDF3] px-2 py-1 text-[10px] font-bold text-[#1F4E79]">可回补</span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-[#5F6B7A]">{`${item.reason} · ${formatDateTime(item.updatedAt)}`}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#CBD7E4] bg-white/60 px-4 py-5 text-center text-xs text-[#7B8898]">
                暂无可回补案例，先完成几条真实复核后这里会自动出现内容。
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-[#DCE4EE] p-6 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">最近漏报案例</p>
              <h2 className="mt-2 text-lg font-bold text-[#1F2A37]">优先召回资产</h2>
            </div>
            <Link
              href="/dashboard/knowledge"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D6E5D3] bg-[#F4FAF3] text-[#6A8F61] transition hover:border-[#BFD7BB] hover:bg-[#EAF5E8]"
              aria-label="进入知识库查看召回资产"
              title="进入知识库查看召回资产"
            >
              <span className="material-symbols-outlined text-2xl">library_books</span>
            </Link>
          </div>
          {data.recentHistoricalMissedCases.length > 0 ? (
            <div className="space-y-3">
              {data.recentHistoricalMissedCases.map((item) => (
                <div key={item.id} className="rounded-xl border border-[#E8DCCB] bg-[#F4FFFB] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2A37]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#7B8898]">{`${item.errorType} · ${item.sourceType}`}</p>
                    </div>
                    <span className={item.verified ? "rounded-full bg-[#E7F4E6] px-2 py-1 text-[10px] font-bold text-[#497447]" : "rounded-full bg-[#F3E9D7] px-2 py-1 text-[10px] font-bold text-[#8A6A24]"}>{item.verified ? "已确认" : "待确认"}</span>
                  </div>
                  <p className="mt-2 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{`优先级 ${item.priority} · ${formatDateTime(item.updatedAt)}`}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#CBD7E4] bg-[#F4FFFB] px-5 py-8 text-center">
              <span className="material-symbols-outlined text-3xl text-[#97A4B2]">history_toggle_off</span>
              <p className="mt-3 text-sm font-medium text-[#5F6B7A]">漏报库当前为空</p>
              <p className="mt-1 text-xs text-[#7B8898]">先完成一批真实复核，系统才会开始沉淀首批历史漏报案例。</p>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
        <FilterSelect label="风险等级" value={riskFilter} options={["全部级别", "高风险", "中风险", "低风险"]} onChange={(value) => { setRiskFilter(value); setCurrentPage(1); }} />
        <FilterSelect label="问题类型" value={typeFilter} options={typeOptions} onChange={(value) => { setTypeFilter(value); setCurrentPage(1); }} />
        <FilterSelect label="归档状态" value={statusFilter} options={["全部状态", "已复盘", "已归档", "已跳过"]} onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }} />
        <div className="glass-panel rounded-xl border border-[#DCE4EE] p-4 lg:col-span-2">
          <label className="mb-3 block font-label text-[10px] uppercase tracking-widest text-[#7B8898]">关键词搜索</label>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1F4E79]">manage_search</span>
            <input value={keyword} onChange={(event) => { setKeyword(event.target.value); setCurrentPage(1); }} placeholder="输入错误代码、日志摘要或事件 ID..." className="w-full border-none bg-transparent text-sm text-[#1F2A37] outline-none placeholder:text-[#8C7F72]" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#DCE4EE] bg-[#FFFFFF] shadow-[0_14px_34px_rgba(31,59,53,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DCE4EE] bg-[#F4FFFB]">
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">问题名称</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">来源日志</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">异常类型</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">风险等级</th>
                <th className="px-6 py-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">归档状态</th>
                <th className="px-6 py-4 text-right font-label text-[10px] uppercase tracking-widest text-[#7B8898]">归档时间</th>
                <th className="px-6 py-4 text-center font-label text-[10px] uppercase tracking-widest text-[#7B8898]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCCB]">
              {pagedRows.length > 0 ? (
                pagedRows.map((row) => <HistoryCaseTableRow key={row.id} row={row} />)
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto max-w-md rounded-[24px] border border-dashed border-[#CBD7E4] bg-[#F4FFFB] px-6 py-10">
                      <span className="material-symbols-outlined text-3xl text-[#97A4B2]">history</span>
                      <p className="mt-3 text-sm font-medium text-[#5F6B7A]">当前筛选条件下暂无历史问题记录</p>
                      <p className="mt-1 text-xs text-[#7B8898]">可以尝试调整风险、状态或关键词后重新查看。</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#DCE4EE] bg-[#F4FFFB] px-6 py-4 md:flex-row md:items-center md:justify-between">
          <span className="font-label text-[10px] uppercase tracking-widest text-[#7A6E63]">{`显示 ${start}-${end} 条，共 ${filteredRows.length} 条历史复盘记录`}</span>
          <div className="flex items-center gap-2">
            <PageArrow disabled={safePage <= 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>chevron_left</PageArrow>
            {Array.from({ length: totalPages }).slice(Math.max(0, safePage - 2), Math.max(0, safePage - 2) + 4).map((_, index) => {
              const page = Math.max(1, safePage - 1) + index;
              if (page > totalPages) return null;
              const active = page === safePage;
              return (
                <button key={page} type="button" onClick={() => setCurrentPage(page)} className={active ? "flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#1F4E79] px-3 font-bold text-white shadow-[0_8px_18px_rgba(31,78,121,0.24)]" : "flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#CBD7E4] bg-white/30 px-3 text-[#5F6B7A] transition-all hover:bg-[#E9EDF3]"}>{page}</button>
              );
            })}
            <PageArrow disabled={safePage >= totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>chevron_right</PageArrow>
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        <TeaserCard icon="auto_awesome" accent="text-[#1F4E79]" title="智能修复建议" description="系统已根据历史复盘记录，为高频问题生成了自动化处置建议和复用模板。" href="/dashboard/high-risk" cta="查看复盘" />
        <TeaserCard icon="book" accent="text-[#3A6A9A]" title="知识沉淀分析" description={`当前已沉淀 ${data.summary.knowledgeTemplateCount} 条有效知识条目，可继续扩展到知识库与规则库。`} href="/dashboard/knowledge" cta="进入知识库" />
        <TeaserCard icon="monitoring" accent="text-[#5F6B7A]" title="趋势回溯" description={`已归档 ${data.summary.archived} 条记录，其中高风险 ${data.summary.highRisk} 条，可回到工作台继续看趋势图。`} href="/dashboard" cta="查看趋势图" />
      </section>
    </div>
  );
}

function OpsMetricCard({ label, value, tone, hint }: { label: string; value: number; tone: string; hint: string }) {
  return (
    <div className="glass-panel rounded-2xl border border-[#DCE4EE] p-5 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
      <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{label}</p>
      <p className={`mt-3 text-3xl font-extrabold tracking-tight ${tone}`}>{value}</p>
      <p className="mt-2 text-xs leading-6 text-[#7B8898]">{hint}</p>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="glass-panel rounded-xl border border-[#DCE4EE] p-4">
      <label className="mb-3 block font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full cursor-pointer border-none bg-transparent p-0 text-sm text-[#1F2A37] outline-none">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function HistoryCaseTableRow({ row }: { row: HistoryCaseRow }) {
  const riskClass = row.riskLabel === "高风险" ? "bg-[#E05B4C] text-[#E05B4C]" : row.riskLabel === "中风险" ? "bg-[#D8A94A] text-[#D8A94A]" : "bg-[#6BAE7A] text-[#6BAE7A]";
  const statusClass = row.reviewStatusLabel === "已复盘" ? "border-[#1F4E79]/20 bg-[#1F4E79]/10 text-[#1F4E79]" : row.reviewStatusLabel === "已归档" ? "border-[#CBD7E4] bg-[#E9EDF3] text-[#5F6B7A]" : "border-[#E8D3A1] bg-[#FFF5DE] text-[#8A6A24]";
  return (
    <tr className="group transition-colors hover:bg-[#F4FFFB]">
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#1F2A37]">{row.title}</span>
          <span className="font-label text-[10px] text-[#7B8898]">{`ID: ${row.incidentId || "-"}`}</span>
        </div>
      </td>
      <td className="px-6 py-5"><span className="rounded bg-white/40 px-2 py-1 text-[10px] font-label text-[#5F6B7A]">{row.sourceLog}</span></td>
      <td className="px-6 py-5 text-xs text-[#5F6B7A]">{row.typeLabel}</td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${riskClass.split(" ")[0]}`} />
          <span className={`text-[10px] font-bold uppercase ${riskClass.split(" ")[1]}`}>{row.riskLabel}</span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold ${statusClass}`}>
          <span className="material-symbols-outlined text-[14px]">{row.reviewStatusLabel === "已复盘" ? "check_circle" : row.reviewStatusLabel === "已归档" ? "archive" : "redo"}</span>
          {row.reviewStatusLabel}
        </span>
      </td>
      <td className="px-6 py-5 text-right font-label text-[10px] text-[#7B8898]">{formatDateTime(row.updatedAt)}</td>
      <td className="px-6 py-5 text-center">
        <Link href={row.logId ? `/dashboard/analyses?logId=${encodeURIComponent(row.logId)}` : "/dashboard/analyses"} className="text-xs font-medium text-[#1F4E79] transition-all hover:text-[#6D451E] hover:underline">查看复盘</Link>
      </td>
    </tr>
  );
}

function PageArrow({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD7E4] bg-white/40 text-[#5F6B7A] transition-all hover:bg-[#E9EDF3] disabled:opacity-40"><span className="material-symbols-outlined text-sm">{children}</span></button>;
}

function TeaserCard({ icon, accent, title, description, href, cta }: { icon: string; accent: string; title: string; description: string; href: string; cta: string }) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl border border-[#DCE4EE] p-6 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#1F4E79]/10 blur-3xl" />
      <span className={`material-symbols-outlined mb-4 ${accent}`}>{icon}</span>
      <h3 className="mb-2 text-lg font-bold text-[#1F2A37]">{title}</h3>
      <p className="text-sm leading-7 text-[#5F6B7A]">{description}</p>
      <Link href={href} className={`mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${accent}`}>{cta}<span className="material-symbols-outlined text-xs">arrow_forward</span></Link>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}




