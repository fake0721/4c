"use client";
/* eslint-disable @next/next/no-img-element */

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountPageData } from "@/lib/dashboard/account";

type AccountPageProps = {
  data: AccountPageData;
};

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDKxvORuVmDZYtE3NianxBmhqHDFlGNIQhdZaqZ_kbEerzfm0VSKHRDubmhDXWaVMlCoOYwSlME0BUwmf3xOvEA1sEj9k6LSzdUYTH0Ze8qq-gB3DT9DWUgGwO4_CUQLgPmStaJdcwhx3uYoBnNSs3kUGyyXnbxSkvcMfsAyjAtve3hUy_oeuD8obins_oVGZu2e9zS8UUjFQPIk1A4Nj88k3eBH7RQQHbsm655peIBdiMt9GUOD3PEDbj_DnwHD2cXDOtQ3gaDjJXA";

export function AccountPage({ data }: AccountPageProps) {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState(data.profile.username);
  const [avatarUrl, setAvatarUrl] = useState(data.profile.avatarUrl);
  const [bio, setBio] = useState(data.profile.bio);
  const [avatarPreview, setAvatarPreview] = useState(resolveAvatarSrc(data.profile.avatarUrl, data.profile.updatedAt));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState("密码建议包含大小写字母、数字和符号。");
  const [passwordError, setPasswordError] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  function validatePassword() {
    if (!newPassword && !confirmPassword) {
      setPasswordMessage("密码建议包含大小写字母、数字和符号。");
      setPasswordError(false);
      return true;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("新密码长度不能少于 8 位。");
      setPasswordError(true);
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("两次输入的新密码不一致。");
      setPasswordError(true);
      return false;
    }

    setPasswordMessage("密码格式通过校验，可以提交更新。");
    setPasswordError(false);
    return true;
  }

  async function handleSaveProfile() {
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await fetch("/api/inner-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update-profile",
          username,
          displayName: username,
          avatarUrl,
          bio,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; updatedAt?: string; avatarUrl?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "保存资料失败，请稍后重试。");
      }

      const nextAvatarUrl = payload?.avatarUrl ?? avatarUrl;
      const nextUpdatedAt = payload?.updatedAt ?? "";
      setAvatarUrl(nextAvatarUrl);
      setAvatarPreview(resolveAvatarSrc(nextAvatarUrl, nextUpdatedAt));
      setProfileMessage("资料已保存。");
      startTransition(() => router.refresh());
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "保存资料失败，请稍后重试。");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    if (savingPassword) return;
    if (!validatePassword()) return;

    setSavingPassword(true);
    try {
      const response = await fetch("/api/inner-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update-password",
          newPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "密码更新失败，请稍后重试。");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("密码更新成功。");
      setPasswordError(false);
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "密码更新失败，请稍后重试。");
      setPasswordError(true);
    } finally {
      setSavingPassword(false);
    }
  }

  function handlePreviewAvatar() {
    avatarInputRef.current?.click();
  }

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const value = typeof loadEvent.target?.result === "string" ? loadEvent.target.result : avatarPreview;
      setAvatarPreview(value);
    };
    reader.readAsDataURL(file);
  }

  function handleAvatarUrlChange(value: string) {
    setAvatarUrl(value);
    setAvatarPreview(resolveAvatarSrc(value, ""));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-24 md:px-8">
      <section className="mb-6">
        <h2 className="mb-2 font-headline text-5xl font-extrabold tracking-tight text-[#1F2A37]">个人页面</h2>
        <p className="text-lg text-[#5F6B7A]">管理头像、用户名、密码与账号安全设置。</p>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card rounded-2xl border border-white/10 p-6 lg:col-span-1">
          <h3 className="mb-5 font-headline text-xl font-bold text-[#1F2A37]">头像与基础信息</h3>
          <div className="flex flex-col items-center gap-4">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#3A6A9A] p-[2px]">
              <img alt="头像预览" className="h-full w-full rounded-full bg-black object-cover" src={avatarPreview} />
            </div>
            <input ref={avatarInputRef} className="hidden" accept="image/*" type="file" onChange={handleAvatarFileChange} />
            <button
              type="button"
              onClick={handlePreviewAvatar}
              className="rounded-lg bg-[#1F4E79]/20 px-4 py-2 text-xs font-bold text-[#1F4E79] transition-colors hover:bg-[#1F4E79]/30"
            >
              本地预览头像
            </button>
            <p className="text-center text-xs text-[#5F6B7A]">支持 JPG/PNG 本地预览；要持久保存，请填写下方头像 URL。</p>
            <div className="w-full pt-2">
              <label className="text-xs uppercase tracking-widest text-[#5F6B7A]">头像 URL</label>
              <input
                className="mt-2 w-full rounded-xl border border-[#CBD7E4] bg-[#DCE4EE] px-4 py-3 text-[#1F2A37] outline-none focus:border-[#4E7FAA] focus:ring-1 focus:ring-[#1F4E79]/20"
                type="url"
                value={avatarUrl}
                onChange={(event) => handleAvatarUrlChange(event.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6 lg:col-span-2 space-y-6">
          <h3 className="font-headline text-xl font-bold text-[#1F2A37]">个人资料</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-[#5F6B7A]">用户名</label>
              <input
                className="mt-2 w-full rounded-xl border border-[#CBD7E4] bg-[#DCE4EE] px-4 py-3 text-[#1F2A37] outline-none focus:border-[#4E7FAA] focus:ring-1 focus:ring-[#1F4E79]/20"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-[#5F6B7A]">邮箱</label>
              <input
                className="mt-2 w-full rounded-xl border border-[#CBD7E4] bg-[#DCE4EE] px-4 py-3 text-[#5F6B7A] outline-none"
                type="email"
                value={data.profile.email}
                readOnly
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs uppercase tracking-widest text-[#5F6B7A]">个人简介</label>
            <textarea
              className="mt-2 w-full rounded-xl border border-[#CBD7E4] bg-[#DCE4EE] px-4 py-3 text-[#1F2A37] outline-none focus:border-[#4E7FAA] focus:ring-1 focus:ring-[#1F4E79]/20"
              rows={3}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="填写你的职责范围..."
            />
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-[#1F2A37]">修改密码</h4>
              <span className="text-xs text-[#1F4E79]">忘记当前密码？请使用重置流程</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-[#5F6B7A]">当前密码</label>
                <input
                  className="mt-2 w-full rounded-xl border border-[#CBD7E4] bg-[#DCE4EE] px-4 py-3 text-[#1F2A37] outline-none focus:border-[#4E7FAA] focus:ring-1 focus:ring-[#1F4E79]/20"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[#5F6B7A]">新密码</label>
                <input
                  className="mt-2 w-full rounded-xl border border-[#CBD7E4] bg-[#DCE4EE] px-4 py-3 text-[#1F2A37] outline-none focus:border-[#4E7FAA] focus:ring-1 focus:ring-[#1F4E79]/20"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  onBlur={validatePassword}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[#5F6B7A]">确认新密码</label>
                <input
                  className="mt-2 w-full rounded-xl border border-[#CBD7E4] bg-[#DCE4EE] px-4 py-3 text-[#1F2A37] outline-none focus:border-[#4E7FAA] focus:ring-1 focus:ring-[#1F4E79]/20"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onBlur={validatePassword}
                />
              </div>
            </div>
            <p className={`mt-2 text-xs ${passwordError ? "text-[#CB4B5A]" : "text-[#5F6B7A]"}`}>{passwordMessage}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3A6A9A]/20 bg-[#3A6A9A]/10 px-4 py-2 text-[10px] font-label uppercase tracking-widest text-[#3A6A9A]">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>
                verified_user
              </span>
              <span>双重验证已启用</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSavePassword}
                className="rounded-xl border border-[#CBD7E4] bg-[#E9EDF3] px-5 py-2.5 text-sm font-bold text-[#5F6B7A] transition-colors hover:bg-[#DCE4EE]"
              >
                {savingPassword ? "保存密码中..." : "更新密码"}
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-xl bg-gradient-to-r from-[#1F4E79] via-[#3A6A9A] to-[#C58B52] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {savingProfile ? "保存中..." : "保存资料"}
              </button>
            </div>
          </div>

          {profileError ? <p className="text-sm text-[#CB4B5A]">{profileError}</p> : null}
          {profileMessage ? <p className="text-sm text-[#2E7D32]">{profileMessage}</p> : null}
        </div>
      </section>


    </div>
  );
}

function resolveAvatarSrc(url: string, version: string) {
  const normalized = String(url ?? "").trim();
  if (!normalized) {
    return DEFAULT_AVATAR;
  }

  const suffix = String(version ?? "").trim();
  const separator = normalized.includes("?") ? "&" : "?";
  return suffix ? `${normalized}${separator}v=${encodeURIComponent(suffix)}` : normalized;
}


