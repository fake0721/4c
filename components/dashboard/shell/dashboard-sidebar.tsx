"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "工作台" },
  { href: "/upload", icon: "analytics", label: "日志分析" },
  { href: "/dashboard/incidents", icon: "biotech", label: "问题处理" },
  { href: "/dashboard/tasks", icon: "history_edu", label: "历史与知识" },
  { href: "/dashboard/rules", icon: "settings_suggest", label: "系统管理" },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();
  const primaryActionHref = pathname === "/upload" ? "/dashboard/high-risk" : "/upload";
  const primaryActionLabel = pathname === "/upload" ? "进入分析记录" : "开始新分析";

  return (
    <aside className="absolute left-0 top-0 z-[60] hidden h-full w-64 flex-col border-r border-white/5 bg-[#3A6A9A] shadow-[4px_0_24px_rgba(0,0,0,0.24)] md:flex">
      <div className="px-6 py-8">
        <h1 className="font-headline text-xl font-black tracking-tight text-white">智能日志分析系统</h1>
      </div>
      <nav className="mt-4 flex flex-col space-y-2 px-4">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/upload" &&
              (pathname === "/dashboard/high-risk" ||
                pathname === "/dashboard/analyses" ||
                pathname.startsWith("/dashboard/logs/"))) ||
            (item.href === "/dashboard/incidents" && pathname === "/dashboard/reviews") ||
            (item.href === "/dashboard/tasks" && (pathname === "/dashboard/history-cases" || pathname === "/dashboard/knowledge")) ||
            (item.href === "/dashboard/rules" && (pathname === "/dashboard/account" || pathname === "/dashboard/settings" || pathname === "/dashboard/performance"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center space-x-3 rounded-xl border-r-4 border-[#2F5F8E] bg-[#FFFFFF] px-4 py-3 text-[#1F2A37] backdrop-blur-md transition-all duration-300"
                  : "flex items-center space-x-3 rounded-xl px-4 py-3 text-[#1F2A37] transition-all duration-200 hover:bg-[#FFFFFF]/70 hover:text-[#1F2A37]"
              }
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: '"FILL" 1' } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-label text-sm uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-6 py-8">
        <Link
          href={primaryActionHref}
          className="block w-full rounded-xl bg-[#FFFFFF] py-3 text-center text-sm font-bold text-[#1F2A37] shadow-lg transition-transform hover:bg-[#E9EDF3] active:scale-95"
        >
          {primaryActionLabel}
        </Link>
        <div className="mt-6 flex flex-col space-y-3">
          <Link
            href="/dashboard/help"
            className={
              pathname === "/dashboard/help"
                ? "flex items-center space-x-2 rounded-lg border border-[#DCE4EE] bg-[#FFFFFF] px-3 py-2 text-xs font-label uppercase text-[#1F2A37]"
                : "flex items-center space-x-2 px-3 py-2 text-xs font-label uppercase text-[#1F2A37] transition-colors hover:text-[#1F2A37]"
            }
          >
            <span className="material-symbols-outlined text-sm">help</span>
            <span>帮助中心</span>
          </Link>
          <Link
            href="/dashboard/docs"
            className={
              pathname === "/dashboard/docs"
                ? "flex items-center space-x-2 rounded-lg border border-[#DCE4EE] bg-[#FFFFFF] px-3 py-2 text-xs font-label uppercase text-[#1F2A37]"
                : "flex items-center space-x-2 px-3 py-2 text-xs font-label uppercase text-[#1F2A37] transition-colors hover:text-[#1F2A37]"
            }
          >
            <span className="material-symbols-outlined text-sm">description</span>
            <span>技术文档</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
