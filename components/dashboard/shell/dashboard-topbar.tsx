"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardUserMenu } from "@/components/dashboard/shell/dashboard-user-menu";

type DashboardTopbarProps = {
  avatarUrl: string | null;
  pendingReviewCount: number;
};

export function DashboardTopbar({ avatarUrl, pendingReviewCount }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => {
    if (pathname === "/upload") {
      return { section: "工作台·日志分析", page: "日志上传" };
    }
    if (pathname === "/dashboard/incidents") {
      return { section: "工作台·问题处理", page: "问题中心" };
    }
    if (pathname === "/dashboard/tasks") {
      return { section: "工作台·历史与知识", page: "历史日志存档" };
    }
    if (pathname === "/dashboard/history-cases") {
      return { section: "工作台·历史与知识", page: "历史问题库" };
    }
    if (pathname === "/dashboard/knowledge") {
      return { section: "工作台·历史与知识", page: "探索根因知识库" };
    }
    if (pathname === "/dashboard/account") {
      return { section: "工作台·系统管理", page: "个人页面" };
    }
    if (pathname === "/dashboard/rules") {
      return { section: "工作台·系统管理", page: "规则配置管理" };
    }
    if (pathname === "/dashboard/settings") {
      return { section: "工作台·系统管理", page: "系统设置" };
    }
    if (pathname === "/dashboard/performance") {
      return { section: "工作台·系统管理", page: "性能分析" };
    }
    if (pathname === "/dashboard/reviews") {
      return { section: "工作台·问题处理", page: "人工复核" };
    }
    if (pathname === "/dashboard/high-risk") {
      return { section: "工作台·日志分析", page: "分析记录" };
    }
    if (pathname === "/dashboard/help") {
      return { section: "系统支持", page: "帮助中心" };
    }
    if (pathname === "/dashboard/docs") {
      return { section: "系统支持", page: "技术文档" };
    }
    if (pathname === "/dashboard/analyses") {
      return { section: "工作台·分析报告", page: "报告详情" };
    }
    return { section: "工作台·控制面板", page: "概览" };
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!popupRef.current?.contains(event.target as Node)) {
        setShowPopup(false);
      }
    }

    if (showPopup) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [showPopup]);

  return (
    <header className="absolute left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#D3DDE8] bg-[#FFFFFF]/76 px-8 backdrop-blur-xl md:left-64">
      <div className="flex items-center space-x-4">
        <span className="font-medium text-[#5F6B7A]">{title.section}</span>
        <span className="text-[#97A4B2]">/</span>
        <span className="font-bold text-[#1F2A37]">{title.page}</span>
      </div>
      <div className="flex items-center space-x-6">
        <div className="relative hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7B8898]">search</span>
          <input
            className="w-64 rounded-full border border-[#DCE4EE] bg-[#F4FFFB] py-1.5 pl-10 pr-4 text-sm text-[#1F2A37] outline-none transition-all placeholder:text-[#7B8898] focus:border-[#4E7FAA] focus:ring-1 focus:ring-[#1F4E79]/20"
            placeholder="搜索数据..."
            type="text"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button className="rounded-full p-2 text-[#5F6B7A] transition-colors hover:bg-[#E9EDF3] hover:text-[#1F2A37]" type="button">
            <span className="material-symbols-outlined">widgets</span>
          </button>
          <div ref={popupRef} className="relative">
            <button
              className="relative rounded-full p-2 text-[#5F6B7A] transition-colors hover:bg-[#E9EDF3] hover:text-[#1F2A37]"
              type="button"
              onClick={() => setShowPopup((value) => !value)}
            >
              <span className="material-symbols-outlined">notifications</span>
              {pendingReviewCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] rounded-full bg-[#FF7085] px-1 text-center text-[10px] leading-4 text-white">
                  {pendingReviewCount > 99 ? "99+" : pendingReviewCount}
                </span>
              ) : null}
            </button>
            <div
              className={`absolute right-0 top-full z-[80] mt-2 w-80 rounded-2xl border border-[#1F4E79]/30 bg-[#FFFFFF]/95 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl ${
                showPopup ? "block" : "hidden"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[#1F4E79]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  notification_important
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1F2A37]">人工复核提醒</p>
                  <p className="mt-1 text-xs text-[#5F6B7A]">
                    {pendingReviewCount > 0 ? `当前有 ${pendingReviewCount} 条问题需要人工复核` : "当前没有待人工复核的问题"}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href="/dashboard/reviews"
                      className="rounded-lg bg-[#1F4E79]/20 px-3 py-1.5 text-xs font-bold text-[#1F4E79] transition-all hover:bg-[#1F4E79]/30"
                    >
                      去处理
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowPopup(false)}
                      className="rounded-lg bg-[#E9EDF3] px-3 py-1.5 text-xs text-[#5F6B7A] transition-all hover:bg-[#DCE4EE]"
                    >
                      稍后
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DashboardUserMenu avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
}

