"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RuleRow, RulesPageData } from "@/lib/dashboard/rules";

type RulesPageProps = {
  data: RulesPageData;
};

const PAGE_SIZE = 10;

type NoticeState = {
  type: "success" | "error";
  message: string;
};

type RenameDialogState = {
  rowId: string;
  source: RuleRow["source"];
  value: string;
};

type DeleteDialogState = {
  rowId: string;
  source: RuleRow["source"];
  displayName: string;
};

export function RulesPage({ data }: RulesPageProps) {
  const [rows, setRows] = useState(data.rows);
  const [stats, setStats] = useState(data.stats);
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [renameDialog, setRenameDialog] = useState<RenameDialogState | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState | null>(null);
  const filterSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return rows.filter((row) => {
      const typeMatch = typeFilter === "全部类型" || toTypeLabel(row.matchType) === typeFilter;
      const statusMatch =
        statusFilter === "全部状态" ||
        (statusFilter === "已启用" && row.enabled) ||
        (statusFilter === "已停用" && !row.enabled) ||
        (statusFilter === "报错中" && row.enabled && row.riskLevel === "high");

      const searchableText = [
        row.displayName,
        row.name,
        row.id,
        row.summary,
        row.pattern,
        row.errorType ?? "",
        row.relatedKnowledge.map((item) => item.title).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const keywordMatch = !normalizedKeyword || searchableText.includes(normalizedKeyword);

      return typeMatch && statusMatch && keywordMatch;
    });
  }, [rows, searchKeyword, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const start = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  async function refreshRules() {
    const response = await fetch("/api/inner-data?view=rules", { credentials: "include" });
    const payload = (await response.json().catch(() => null)) as RulesPageData | { error?: string } | null;
    if (!response.ok || !payload || !("rows" in payload) || !("stats" in payload)) {
      throw new Error((payload && "error" in payload && payload.error) || "规则数据刷新失败。");
    }

    setRows(payload.rows);
    setStats(payload.stats);
  }

  async function postAction(body: Record<string, unknown>) {
    const response = await fetch("/api/inner-data", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "规则操作失败，请稍后重试。");
    }
  }

  function getKnowledgeId(rowId: string) {
    return rowId.startsWith("knowledge:") ? rowId.slice("knowledge:".length) : rowId;
  }

  function scrollToFilters() {
    filterSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showNotice(type: NoticeState["type"], message: string) {
    setNotice({ type, message });
  }

  async function handleToggle(row: RuleRow) {
    if (busyId) return;
    setBusyId(row.id);
    try {
      await postAction({ action: "rules-toggle", ruleId: row.id, enabled: !row.enabled });
      setRows((current) =>
        current.map((item) => (item.id === row.id ? { ...item, enabled: !item.enabled, updatedAt: new Date().toISOString() } : item)),
      );
      setStats((current) => ({
        ...current,
        enabled: current.enabled + (row.enabled ? -1 : 1),
        paused: current.paused + (row.enabled ? 1 : -1),
        warnings: row.riskLevel === "high" ? current.warnings + (row.enabled ? -1 : 1) : current.warnings,
      }));
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "规则状态更新失败。");
    } finally {
      setBusyId(null);
    }
  }

  function handleRename(row: RuleRow) {
    if (busyId) return;

    setRenameDialog({
      rowId: row.id,
      source: row.source,
      value: row.displayName || row.name || "",
    });
  }

  async function confirmRename() {
    if (!renameDialog || busyId) return;
    const nextName = renameDialog.value.trim();
    if (!nextName) {
      showNotice("error", renameDialog.source === "knowledge" ? "知识条目名称不能为空。" : "规则名称不能为空。");
      return;
    }

    setBusyId(renameDialog.rowId);
    try {
      if (renameDialog.source === "knowledge") {
        await postAction({
          action: "knowledge-rename",
          knowledgeId: getKnowledgeId(renameDialog.rowId),
          title: nextName.trim(),
        });
      } else {
        await postAction({ action: "rules-rename", ruleId: renameDialog.rowId, ruleName: nextName.trim() });
      }
      await refreshRules();
      setRenameDialog(null);
      showNotice("success", renameDialog.source === "knowledge" ? "知识条目已重命名。" : "规则已重命名。");
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : renameDialog.source === "knowledge" ? "知识条目重命名失败。" : "规则重命名失败。",
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleDelete(row: RuleRow) {
    if (busyId) return;

    setDeleteDialog({
      rowId: row.id,
      source: row.source,
      displayName: row.displayName,
    });
  }

  async function confirmDelete() {
    if (!deleteDialog || busyId) return;

    setBusyId(deleteDialog.rowId);
    try {
      if (deleteDialog.source === "knowledge") {
        await postAction({ action: "knowledge-delete", knowledgeId: getKnowledgeId(deleteDialog.rowId) });
      } else {
        await postAction({ action: "rules-delete", ruleId: deleteDialog.rowId });
      }
      await refreshRules();
      setDeleteDialog(null);
      showNotice("success", deleteDialog.source === "knowledge" ? "知识条目已删除。" : "规则已删除。");
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : deleteDialog.source === "knowledge" ? "知识条目删除失败。" : "规则删除失败。",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <InlineNotice notice={notice} onClose={() => setNotice(null)} />

      <header className="mb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="mb-2 font-headline text-4xl font-extrabold tracking-tight text-[#1F2A37]">规则配置管理</h1>
            <p className="text-sm leading-relaxed text-[#5F6B7A]">
              规则来源于用户使用中未被系统覆盖的问题，经人工复核沉淀到知识库后，在多次复现时转化为可执行规则。
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={scrollToFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-[#DECDB6] bg-[#FFFFFF] px-6 py-2.5 font-label text-xs uppercase tracking-widest text-[#5F6B7A] transition-all hover:border-[#4E7FAA]"
            >
              <span className="material-symbols-outlined text-base">filter_list</span>
              过滤条件
            </button>
          </div>
        </div>
      </header>

      <section className="glass-panel sticky top-20 z-20 mb-8 rounded-2xl border border-[#DCE4EE] p-4 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">系统管理自由切换</p>
          <span className="text-[10px] text-[#97A4B2]">在三个页面之间快速跳转</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button
            type="button"
            className="rounded-xl border border-[#1F4E79]/30 bg-gradient-to-r from-[#1F4E79]/20 to-transparent px-4 py-3 text-sm font-bold text-[#1F4E79]"
          >
            规则配置（当前）
          </button>
          <Link
            href="/dashboard/performance"
            className="rounded-xl border border-[#DCE4EE] bg-white/25 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]"
          >
            性能分析
          </Link>
          <Link
            href="/dashboard/settings"
            className="rounded-xl border border-[#DCE4EE] bg-white/25 px-4 py-3 text-center text-sm font-medium text-[#5F6B7A] transition-all hover:border-[#D1B58A] hover:text-[#1F2A37]"
          >
            系统设置
          </Link>
        </div>
      </section>

      <section className="glass-panel mb-8 flex flex-col gap-3 rounded-2xl border border-[#DCE4EE] p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs leading-relaxed text-[#5F6B7A]">沉淀链路：用户遇到系统未覆盖问题 → 人工复核确认 → 知识库沉淀 → 高频复现写入规则库。</p>
        <Link href="/dashboard/history-cases" className="inline-flex items-center gap-2 text-xs font-bold text-[#1F4E79] transition-colors hover:text-[#6D451E]">
          <span className="material-symbols-outlined text-sm">schema</span>
          <span>查看沉淀来源</span>
        </Link>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatsCard icon="rule" label="总计" value={stats.total} help="当前激活规则总数" iconColor="text-[#1F4E79]" />
        <StatsCard icon="check_circle" label="启用" value={stats.enabled} help="正在运行中" iconColor="text-[#3B925F]" />
        <StatsCard icon="warning" label="警报" value={stats.warnings} help="规则逻辑报错" iconColor="text-[#E68A17]" />
        <StatsCard icon="pause_circle" label="暂停" value={stats.paused} help="已手动停用" iconColor="text-[#B88A24]" />
      </section>

      <section ref={filterSectionRef} className="glass-panel overflow-hidden rounded-2xl border border-[#DCE4EE] shadow-[0_12px_30px_rgba(31,59,53,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#DCE4EE] bg-[#F4FFFB] px-8 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 md:gap-4">
            <label className="flex min-w-[260px] flex-col gap-2 text-xs text-[#7B8898]">
              <span className="font-label uppercase tracking-widest">搜索规则</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-[#97A4B2]">search</span>
                <input
                  value={searchKeyword}
                  onChange={(event) => {
                    setSearchKeyword(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="输入名称、ID、描述或模式关键字"
                  className="w-full rounded-xl border border-[#CBD7E4] bg-white/40 py-2.5 pl-10 pr-10 text-sm text-[#1F2A37] outline-none transition-all placeholder:text-[#97A4B2] focus:border-[#D1B58A]"
                />
                {searchKeyword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKeyword("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#7B8898] transition hover:bg-white/80"
                    aria-label="清空搜索"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                ) : null}
              </div>
            </label>

            <div className="flex flex-col gap-4 md:flex-row md:gap-8">
            <FilterSelect
              label="规则类型"
              value={typeFilter}
              options={["全部类型", "正则匹配", "AI 语义", "关键词", "知识条目"]}
              onChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            />
            <FilterSelect
              label="运行状态"
              value={statusFilter}
              options={["全部状态", "已启用", "已停用", "报错中"]}
              onChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            />
            </div>
          </div>
          <span className="text-xs italic text-[#7B8898]">{`显示 ${start}-${end} 条，共 ${filteredRows.length.toLocaleString("zh-CN")} 条记录`}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#DCE4EE] bg-white/30">
                <th className="px-8 py-4 font-label text-[10px] font-medium uppercase tracking-widest text-[#7B8898]">规则名称与 ID</th>
                <th className="px-6 py-4 font-label text-[10px] font-medium uppercase tracking-widest text-[#7B8898]">类型</th>
                <th className="px-6 py-4 font-label text-[10px] font-medium uppercase tracking-widest text-[#7B8898]">描述</th>
                <th className="px-6 py-4 font-label text-[10px] font-medium uppercase tracking-widest text-[#7B8898]">最后更新</th>
                <th className="px-6 py-4 font-label text-[10px] font-medium uppercase tracking-widest text-[#7B8898]">运行状态</th>
                <th className="px-8 py-4 text-right font-label text-[10px] font-medium uppercase tracking-widest text-[#7B8898]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCCB]">
              {pagedRows.length > 0 ? (
                pagedRows.map((row) => (
                  <RuleTableRow
                    key={row.id}
                    row={row}
                    busy={busyId === row.id}
                    onToggle={handleToggle}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-sm text-[#7B8898]">
                    当前筛选条件下暂无规则数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#DCE4EE] bg-[#F4FFFB] px-8 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#CBD7E4] bg-white/30 text-[#5F6B7A] transition-all hover:bg-[#E9EDF3] disabled:opacity-30"
              disabled={safePage <= 1}
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }).slice(Math.max(0, safePage - 2), Math.max(0, safePage - 2) + 4).map((_, index) => {
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
                      ? "flex h-8 min-w-8 items-center justify-center rounded bg-[#1F4E79] px-3 text-xs font-bold text-white"
                      : "flex h-8 min-w-8 items-center justify-center rounded border border-[#CBD7E4] bg-white/30 px-3 text-xs text-[#5F6B7A] transition-all hover:bg-[#E9EDF3]"
                  }
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#CBD7E4] bg-white/30 text-[#5F6B7A] transition-all hover:bg-[#E9EDF3] disabled:opacity-30"
              disabled={safePage >= totalPages}
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>

          <div className="flex items-center gap-4 font-label text-[10px] uppercase tracking-widest text-[#7B8898]">
            <span>跳至</span>
            <input value={String(safePage)} readOnly className="h-8 w-12 rounded border border-[#CBD7E4] bg-white/30 text-center text-[#1F2A37]" />
            <span>页</span>
          </div>
        </div>
      </section>

      <RenameDialog
        open={Boolean(renameDialog)}
        title={renameDialog?.source === "knowledge" ? "重命名知识条目" : "重命名规则"}
        value={renameDialog?.value ?? ""}
        pending={Boolean(renameDialog && busyId === renameDialog.rowId)}
        onChange={(value) => setRenameDialog((current) => (current ? { ...current, value } : current))}
        onCancel={() => {
          if (busyId) return;
          setRenameDialog(null);
        }}
        onConfirm={confirmRename}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteDialog)}
        title={deleteDialog?.source === "knowledge" ? "确认删除知识条目？" : "确认删除规则？"}
        message={`即将删除：${deleteDialog?.displayName ?? "该条目"}。删除后无法恢复。`}
        pending={Boolean(deleteDialog && busyId === deleteDialog.rowId)}
        onCancel={() => {
          if (busyId) return;
          setDeleteDialog(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function InlineNotice({ notice, onClose }: { notice: NoticeState | null; onClose: () => void }) {
  if (!notice) {
    return null;
  }

  const isError = notice.type === "error";

  return (
    <div className="fixed right-6 top-24 z-[120] w-[min(460px,calc(100vw-2rem))]">
      <div className={`rounded-2xl border px-4 py-3 shadow-[0_16px_40px_rgba(31,42,55,0.22)] ${isError ? "border-[#F3C6CC] bg-[#FFF3F3]" : "border-[#CFE6D9] bg-[#F1FBF5]"}`}>
        <div className="flex items-start gap-3">
          <span className={`material-symbols-outlined mt-0.5 text-base ${isError ? "text-[#CB4B5A]" : "text-[#2F6A42]"}`}>
            {isError ? "error" : "check_circle"}
          </span>
          <p className={`flex-1 text-sm leading-6 ${isError ? "text-[#8E2D38]" : "text-[#245439]"}`}>{notice.message}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#7B8898] transition hover:bg-black/5"
            aria-label="关闭提示"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RenameDialog({
  open,
  title,
  value,
  pending,
  onChange,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1F2A37]/35 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-lg rounded-2xl border border-[#DCE4EE] bg-white p-6 shadow-[0_18px_48px_rgba(31,42,55,0.24)]">
        <h3 className="text-lg font-bold text-[#1F2A37]">{title}</h3>
        <p className="mt-1 text-sm text-[#5F6B7A]">请输入新的名称后保存。</p>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs uppercase tracking-widest text-[#7B8898]">名称</span>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !pending) {
                event.preventDefault();
                onConfirm();
              }
            }}
            className="w-full rounded-xl border border-[#CBD7E4] bg-[#F8FBFF] px-4 py-3 text-sm text-[#1F2A37] outline-none transition focus:border-[#4E7FAA]"
            placeholder="请输入名称"
            autoFocus
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-[#CBD7E4] bg-[#F4FFFB] px-4 py-2 text-sm font-medium text-[#5F6B7A] transition hover:border-[#97A4B2] disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-lg border border-[#285C88] bg-[#1F4E79] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1A4268] disabled:opacity-60"
          >
            {pending ? "保存中..." : "确认保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({
  open,
  title,
  message,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1F2A37]/35 px-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md rounded-2xl border border-[#DCE4EE] bg-white p-6 shadow-[0_18px_48px_rgba(31,42,55,0.24)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#FFE2E6] text-[#CB4B5A]">
            <span className="material-symbols-outlined text-base">delete</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1F2A37]">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#5F6B7A]">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-[#CBD7E4] bg-[#F4FFFB] px-4 py-2 text-sm font-medium text-[#5F6B7A] transition hover:border-[#97A4B2] disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-lg border border-[#E8C7C7] bg-[#CB4B5A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#B93F4E] disabled:opacity-60"
          >
            {pending ? "删除中..." : "确认删除"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  help,
  iconColor,
}: {
  icon: string;
  label: string;
  value: number;
  help: string;
  iconColor: string;
}) {
  return (
    <div className="glass-panel rounded-2xl border border-[#DCE4EE] p-6 shadow-[0_10px_24px_rgba(31,59,53,0.05)]">
      <div className="mb-4 flex items-start justify-between">
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        <span className="font-label text-[10px] uppercase tracking-widest text-[#7B8898]">{label}</span>
      </div>
      <div className="font-headline text-3xl font-bold text-[#1F2A37]">{value.toLocaleString("zh-CN")}</div>
      <div className="mt-1 text-xs text-[#7B8898]">{help}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-[140px] flex-col gap-2 text-xs text-[#7B8898]">
      <span className="font-label uppercase tracking-widest">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-[#CBD7E4] bg-white/40 px-4 py-2.5 text-sm text-[#1F2A37] outline-none transition-all focus:border-[#D1B58A]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RuleTableRow({
  row,
  busy,
  onToggle,
  onRename,
  onDelete,
}: {
  row: RuleRow;
  busy: boolean;
  onToggle: (row: RuleRow) => void;
  onRename: (row: RuleRow) => void;
  onDelete: (row: RuleRow) => void;
}) {
  return (
    <tr className="bg-white/20 transition-all hover:bg-white/35">
      <td className="px-8 py-5 align-top">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => onToggle(row)}
            className={
              row.enabled
                ? "mt-1 inline-flex h-6 w-10 items-center rounded-full bg-[#1F4E79] px-1 transition-transform active:scale-95"
                : "mt-1 inline-flex h-6 w-10 items-center rounded-full bg-[#DCE4EE] px-1 transition-transform active:scale-95"
            }
            disabled={busy}
          >
            <span
              className={
                row.enabled
                  ? "h-4 w-4 translate-x-4 rounded-full bg-white shadow"
                  : "h-4 w-4 translate-x-0 rounded-full bg-white shadow"
              }
            ></span>
          </button>
          <div>
            <div className="font-medium text-[#1F2A37]">{row.displayName}</div>
            <div className="font-mono text-[11px] text-[#7B8898]">{row.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5 align-top">
        <span className="inline-flex rounded-full border border-[#CBD7E4] bg-[#FFFFFF] px-3 py-1 text-xs text-[#5F6B7A]">{toTypeLabel(row.matchType)}</span>
      </td>
      <td className="px-6 py-5 align-top">
        <div className="max-w-md text-sm leading-relaxed text-[#5F6B7A]">{row.summary}</div>
        {row.relatedKnowledge.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {row.relatedKnowledge.map((item) => (
              <span key={`${row.id}-${item.id}`} className="rounded-full border border-[#CBD7E4] bg-[#F4FFFB] px-2 py-0.5 text-[10px] text-[#5F6B7A]">
                知识库：{item.title}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-[11px] text-[#97A4B2]">未匹配到知识库条目</div>
        )}
      </td>
      <td className="px-6 py-5 align-top text-sm text-[#5F6B7A]">{formatDate(row.updatedAt)}</td>
      <td className="px-6 py-5 align-top">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold">
          <span className={`h-2 w-2 rounded-full ${row.enabled ? "bg-[#3B925F]" : "bg-[#97A4B2]"}`}></span>
          <span className={row.enabled ? "text-[#3B925F]" : "text-[#7B8898]"}>{row.enabled ? "启用中" : "已停用"}</span>
        </div>
      </td>
      <td className="px-8 py-5 align-top">
        <div className="flex justify-end gap-2 text-xs">
          <ActionButton label="重命名" busy={busy} onClick={() => onRename(row)} />
          <ActionButton label="删除" busy={busy} danger onClick={() => onDelete(row)} />
        </div>
      </td>
    </tr>
  );
}

function ActionButton({
  label,
  onClick,
  busy,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={
        danger
          ? "rounded-lg border border-[#E8C7C7] bg-[#FFF3F3] px-3 py-2 text-[#CB4B5A] transition-all hover:border-[#D89D9D] disabled:opacity-50"
          : "rounded-lg border border-[#CBD7E4] bg-[#F4FFFB] px-3 py-2 text-[#5F6B7A] transition-all hover:border-[#4E7FAA] hover:text-[#1F2A37] disabled:opacity-50"
      }
    >
      {label}
    </button>
  );
}

function toTypeLabel(value: string) {
  if (value === "knowledge") return "知识条目";
  if (value === "regex") return "正则匹配";
  if (value === "keyword") return "关键词";
  return "AI 语义";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
