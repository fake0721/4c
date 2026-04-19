"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/components/dashboard/status-pill";

type AuthNoticeProps = {
  configured: boolean;
  status?: string;
  message?: string;
};

export function AuthNotice({
  configured,
  status,
  message,
}: AuthNoticeProps) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);

      const url = new URL(window.location.href);
      url.searchParams.delete("status");
      url.searchParams.delete("message");
      url.searchParams.delete("clear");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }, 3600);

    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message || !visible) {
    return null;
  }

  const tone =
    status === "error" ? "danger" : status === "success" ? "success" : "info";

  return (
    <div className="fixed left-1/2 top-24 z-[70] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 animate-[toast-in_220ms_ease-out] rounded-[24px] border border-white/12 bg-slate-950/92 p-4 shadow-[0_22px_70px_rgba(2,8,18,0.55)] backdrop-blur-xl md:top-28">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">认证提示</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
        </div>
        <StatusPill
          label={configured ? "已配置" : "待配置"}
          tone={configured ? "success" : tone}
        />
      </div>
    </div>
  );
}
