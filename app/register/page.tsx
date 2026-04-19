import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";

export default function RegisterPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F3F5F8] text-[#1F2A37]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-[-5%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#1F4E79]/20 blur-[120px]" />
        <div className="absolute bottom-[5%] right-[-5%] h-[460px] w-[460px] rounded-full bg-[#3A6A9A]/20 blur-[120px]" />
      </div>

      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/20 bg-white/10 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xl font-headline font-extrabold">
          <span className="material-symbols-outlined text-[#1F4E79]">bolt</span>
          智能日志分析系统
        </div>
        <Link href="/" className="text-sm text-[#5F6B7A] transition hover:text-[#1F2A37]">返回首页</Link>
      </nav>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 pb-12 pt-24">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-[2rem] border border-white/30 p-10 shadow-[0_20px_60px_rgba(31,78,121,0.15)] md:p-12">
            <div className="mb-8 space-y-2">
              <h1 className="text-4xl font-headline font-extrabold tracking-tight">创建账号</h1>
              <p className="text-sm text-[#5F6B7A]">注册后即可进入日志上传与分析流程</p>
            </div>

            <form action={signUpAction} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-label uppercase tracking-widest text-[#5F6B7A]">团队名称</label>
                  <input
                    name="teamName"
                    type="text"
                    className="w-full rounded-xl border border-transparent bg-[#E9EDF3] px-4 py-4 outline-none focus:border-[#1F4E79]/40 focus:ring-0"
                    placeholder="AIOps Team"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-label uppercase tracking-widest text-[#5F6B7A]">电子邮箱</label>
                  <input
                    name="registerEmail"
                    type="email"
                    className="w-full rounded-xl border border-transparent bg-[#E9EDF3] px-4 py-4 outline-none focus:border-[#1F4E79]/40 focus:ring-0"
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-label uppercase tracking-widest text-[#5F6B7A]">密码</label>
                  <input
                    name="registerPassword"
                    type="password"
                    className="w-full rounded-xl border border-transparent bg-[#E9EDF3] px-4 py-4 outline-none focus:border-[#1F4E79]/40 focus:ring-0"
                    placeholder="至少 8 位字符"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-headline font-bold text-black shadow-[0_12px_30px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                立即注册
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-[#5F6B7A]">
              已有账号？
              <Link href="/login" className="ml-2 font-semibold transition hover:text-[#1F4E79]">去登录</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
