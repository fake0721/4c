"use client";

import { useEffect } from "react";

type LoginSessionResetProps = {
  enabled: boolean;
};

export function LoginSessionReset({ enabled }: LoginSessionResetProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetch("/auth/session/clear", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    }).finally(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("clear");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    });
  }, [enabled]);

  return null;
}
