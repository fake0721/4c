import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware-client";

const INNER_PAGE_REDIRECTS: Record<string, string> = {
  "工作台": "/dashboard",
  "日志上传": "/upload",
  "问题中心": "/dashboard/incidents",
  "人工复核": "/dashboard/reviews",
  "分析记录": "/dashboard/high-risk",
  "分析报告": "/dashboard/analyses",
  "analysis-report": "/dashboard/analyses",
  "历史日志存档": "/dashboard/tasks",
  "历史问题库": "/dashboard/history-cases",
  "规则配置管理": "/dashboard/rules",
  "性能分析": "/dashboard/performance",
  "系统设置": "/dashboard/settings",
  "个人页面": "/dashboard/account",
  "帮助中心": "/dashboard/help",
  "技术文档": "/dashboard/docs",
  "探索根因知识库": "/dashboard/knowledge",
  "首页": "/",
  "登录": "/login",
  "注册": "/register",
  "忘记密码": "/auth/reset-password",
};

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function resolveInnerPageRedirect(pathname: string) {
  const decodedPath = decodePathname(pathname);
  const segments = decodedPath.split("/").filter(Boolean);

  if (segments[0] !== "inner-pages" || segments.length < 2) {
    return null;
  }

  const innerPageKey = segments[1];
  const target = INNER_PAGE_REDIRECTS[innerPageKey];
  if (!target) {
    return null;
  }

  if (segments.length === 2 || (segments.length === 3 && segments[2] === "code.html")) {
    return target;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const innerPageTarget = resolveInnerPageRedirect(request.nextUrl.pathname);
  if (innerPageTarget) {
    return NextResponse.redirect(new URL(innerPageTarget, request.url));
  }

  const result = updateSession(request);
  const response = result instanceof NextResponse ? result : result.response;

  if (!hasSupabaseEnv()) {
    return response;
  }

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const sessionResponse = result instanceof NextResponse ? null : result;
    const {
      data: { user },
    } = await sessionResponse!.supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("status", "error");
      loginUrl.searchParams.set("message", "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u8bbf\u95ee\u5de5\u4f5c\u53f0\u3002");
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/inner-pages/:path*"],
};
