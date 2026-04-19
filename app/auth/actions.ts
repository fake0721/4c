"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { ensureProfileForUser } from "@/lib/supabase/profile";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function toSignInErrorMessage(message: string) {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "\u90ae\u7bb1\u6216\u5bc6\u7801\u9519\u8bef\u3002";
  }

  if (normalized.includes("email not confirmed") || normalized.includes("email") && normalized.includes("confirm")) {
    return "\u8be5\u8d26\u53f7\u5c1a\u672a\u5b8c\u6210\u90ae\u7bb1\u9a8c\u8bc1\uff0c\u8bf7\u5148\u6253\u5f00\u9a8c\u8bc1\u90ae\u4ef6\u5b8c\u6210\u786e\u8ba4\u3002";
  }

  if (normalized.includes("too many requests") || normalized.includes("rate limit")) {
    return "\u5c1d\u8bd5\u767b\u5f55\u6b21\u6570\u8fc7\u591a\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002";
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "\u767b\u5f55\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5\u3002";
  }

  return message;
}

export async function signInAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/login", "\u8bf7\u5148\u914d\u7f6e NEXT_PUBLIC_SUPABASE_URL \u548c Supabase \u516c\u94a5\u3002");
  }

  const email = getTrimmedValue(formData, "email");
  const password = getTrimmedValue(formData, "password");

  if (!email || !password) {
    return encodedRedirect("error", "/login", "\u90ae\u7bb1\u548c\u5bc6\u7801\u4e0d\u80fd\u4e3a\u7a7a\u3002");
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    await supabase.auth.signOut({ scope: "local" });

    return encodedRedirect("error", "/login", toSignInErrorMessage(error.message), { clear: "1" });
  }

  if (!data.session || !data.user) {
    await supabase.auth.signOut({ scope: "local" });
    return encodedRedirect("error", "/login", "\u767b\u5f55\u672a\u5efa\u7acb\u6709\u6548\u4f1a\u8bdd\uff0c\u8bf7\u91cd\u8bd5\u3002", { clear: "1" });
  }

  await ensureProfileForUser(data.user);
  return encodedRedirect("success", "/dashboard", "\u767b\u5f55\u6210\u529f\u3002");
}

export async function signUpAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/register", "\u8bf7\u5148\u914d\u7f6e NEXT_PUBLIC_SUPABASE_URL \u548c Supabase \u516c\u94a5\u3002");
  }

  const email = getTrimmedValue(formData, "registerEmail");
  const password = getTrimmedValue(formData, "registerPassword");
  const teamName = getTrimmedValue(formData, "teamName");
  const { siteUrl } = getSupabaseEnv();

  if (!email || !password || !teamName) {
    return encodedRedirect("error", "/register", "\u8bf7\u5b8c\u6574\u586b\u5199\u6ce8\u518c\u4fe1\u606f\u3002");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        team_name: teamName,
      },
      emailRedirectTo: siteUrl + "/auth/callback",
    },
  });

  if (error) {
    return encodedRedirect("error", "/register", error.message);
  }

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return encodedRedirect(
      "error",
      "/register",
      "\u6ce8\u518c\u672a\u6210\u529f\uff1a\u8be5\u90ae\u7bb1\u53ef\u80fd\u5df2\u6ce8\u518c\uff0c\u6216\u5f53\u524d Supabase Auth \u8bbe\u7f6e\u963b\u6b62\u4e86\u65b0\u7528\u6237\u521b\u5efa\u3002\u8bf7\u6362\u4e00\u4e2a\u90ae\u7bb1\uff0c\u6216\u68c0\u67e5 Authentication -> Providers -> Email \u662f\u5426\u5f00\u542f Signups\u3002",
    );
  }

  if (data.user && data.session) {
    await ensureProfileForUser(data.user);
    return encodedRedirect("success", "/dashboard", "\u6ce8\u518c\u6210\u529f\uff0c\u5df2\u81ea\u52a8\u767b\u5f55\u3002");
  }

  if (!data.user) {
    return encodedRedirect("error", "/register", "\u6ce8\u518c\u672a\u6210\u529f\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
  }

  return encodedRedirect("success", "/login", "\u6ce8\u518c\u8bf7\u6c42\u5df2\u63d0\u4ea4\uff0c\u8bf7\u68c0\u67e5\u90ae\u7bb1\u5e76\u5b8c\u6210\u9a8c\u8bc1\u3002\u9a8c\u8bc1\u5b8c\u6210\u540e\u5373\u53ef\u767b\u5f55\u3002");
}

export async function signOutAction() {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/", "Supabase \u73af\u5883\u53d8\u91cf\u5c1a\u672a\u914d\u7f6e\u3002");
  }

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });

  return encodedRedirect("success", "/", "\u5df2\u9000\u51fa\u767b\u5f55\u3002");
}
