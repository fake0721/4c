"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function requestPasswordResetAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/auth/reset-password", "Supabase 环境变量尚未配置。");
  }

  const email = getTrimmedValue(formData, "email");
  const { siteUrl } = getSupabaseEnv();

  if (!email) {
    return encodedRedirect("error", "/auth/reset-password", "请输入邮箱地址。");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return encodedRedirect("error", "/auth/reset-password", error.message);
  }

  return encodedRedirect(
    "success",
    "/auth/reset-password",
    "重置密码邮件已发送，请打开邮箱中的恢复链接。",
  );
}

export async function updatePasswordAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/auth/reset-password", "Supabase 环境变量尚未配置。");
  }

  const password = getTrimmedValue(formData, "password");
  const confirmPassword = getTrimmedValue(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    return encodedRedirect("error", "/auth/reset-password", "请填写两次密码。");
  }

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/auth/reset-password", "两次输入的密码不一致。");
  }

  if (password.length < 8) {
    return encodedRedirect("error", "/auth/reset-password", "密码至少需要 8 位字符。");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/auth/reset-password",
      "恢复会话已过期，请重新发送重置密码邮件。",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return encodedRedirect("error", "/auth/reset-password", error.message);
  }

  return encodedRedirect("success", "/", "密码已更新，请重新登录。");
}
