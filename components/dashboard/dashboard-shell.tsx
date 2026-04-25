import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { StatusPill } from "@/components/dashboard/status-pill";

type DashboardShellProps = {
  userEmail: string;
  teamName: string | null;
  activeView: "workbench" | "analysis" | "issues" | "history" | "system" | "account";
  children: React.ReactNode;
};

const navItems = [
  { key: "workbench", href: "/dashboard", label: "工作台" },
  { key: "analysis", href: "/dashboard/analyses", label: "分析模块" },
  { key: "issues", href: "/dashboard/incidents", label: "问题模块" },
  { key: "history", href: "/dashboard/tasks", label: "历史与知识" },
  { key: "system", href: "/dashboard/rules", label: "系统管理" },
  { key: "account", href: "/dashboard/account", label: "个人中心" },
] as const;

export function DashboardShell({
  userEmail,
  teamName,
  activeView,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(105,177,255,0.22),_transparent_32%),linear-gradient(180deg,_#f5f7fa_0%,_#ffffff_58%,_#eef4ff_100%)] text-[#1D2129]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-6 md:px-8 lg:px-10">
        <section className="dashboard-panel rounded-[32px] border border-[#dce4ee] bg-white p-5 shadow-[0_18px_52px_rgba(31,42,55,0.12)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#165DFF,_#69B1FF)] text-sm font-bold text-white shadow-[0_8px_20px_rgba(22,93,255,0.28)]">
                LA
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#69B1FF]">
                  运维工作台
                </p>
                <h1 className="mt-1 text-xl font-semibold text-[#1D2129]">
                  智能日志分析控制台
                </h1>
                <p className="mt-1 text-sm text-[#4E5969]">
                  当前账号：{userEmail}
                  {teamName ? ` | 团队：${teamName}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <StatusPill label="Supabase 在线" tone="success" />
              <Link
                href="/"
                className="rounded-full border border-[#D7E2F0] bg-white px-4 py-2 text-sm font-medium text-[#314254] transition hover:border-[#69B1FF] hover:bg-[#EEF4FF]"
              >
                返回登录页
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-[#165DFF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0E42D2]"
                >
                  退出登录
                </button>
              </form>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {navItems.map((item) => {
              const active = item.key === activeView;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[#165DFF] text-white shadow-[0_8px_18px_rgba(22,93,255,0.25)]"
                      : "border border-[#d3dde8] bg-white text-[#314254] hover:border-[#69B1FF] hover:bg-[#EEF4FF]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
