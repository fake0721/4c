import Link from "next/link";
import { signInAction } from "@/app/auth/actions";
import { AuthNotice } from "@/components/auth/auth-notice";
import { LoginSessionReset } from "@/components/auth/login-session-reset";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server-client";

type LoginPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    clear?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();
  const shouldClearSession = params.clear === "1";

  if (configured) {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#F3F5F8] text-[#1F2A37]">
      <LoginSessionReset enabled={shouldClearSession} />
      <AuthNotice
        configured={configured}
        status={typeof params.status === "string" ? params.status : undefined}
        message={typeof params.message === "string" ? params.message : undefined}
      />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-[-5%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#1F4E79]/20 blur-[120px]" />
        <div className="absolute bottom-[5%] right-[-5%] h-[460px] w-[460px] rounded-full bg-[#3A6A9A]/20 blur-[120px]" />
      </div>

      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-white/20 bg-white/10 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xl font-headline font-extrabold">
          <span className="material-symbols-outlined text-[#1F4E79]">bolt</span>
          运维智析平台
        </div>
        <Link href="/" className="text-sm text-[#5F6B7A] transition hover:text-[#1F2A37]">
          返回首页
        </Link>
      </nav>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 pb-12 pt-24">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-[2rem] border border-white/30 p-10 shadow-[0_20px_60px_rgba(31,78,121,0.15)] md:p-12">
            <div className="mb-8 space-y-2">
              <h1 className="text-4xl font-headline font-extrabold tracking-tight">欢迎回来</h1>
            </div>

            <form action={signInAction} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-label uppercase tracking-widest text-[#5F6B7A]">邮箱</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6B7A]">person</span>
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded-xl border border-transparent bg-[#E9EDF3] py-4 pl-12 pr-4 outline-none focus:border-[#1F4E79]/40 focus:ring-0"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-xs font-label uppercase tracking-widest text-[#5F6B7A]">密码</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6B7A]">lock</span>
                    <input
                      name="password"
                      type="password"
                      className="w-full rounded-xl border border-transparent bg-[#E9EDF3] py-4 pl-12 pr-4 outline-none focus:border-[#1F4E79]/40 focus:ring-0"
                      placeholder="请输入登录密码"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 font-headline font-bold text-black shadow-[0_12px_30px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                立即登录
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-[#5F6B7A]">
              <Link href="/auth/reset-password" className="transition hover:text-[#1F4E79]">
                忘记密码
              </Link>
              <span className="mx-3">|</span>
              <Link href="/register" className="font-semibold transition hover:text-[#1F4E79]">
                立即注册
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
