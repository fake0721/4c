import { redirect } from "next/navigation";

export function encodedRedirect(
  status: "error" | "success",
  path: string,
  message: string,
  extraParams?: Record<string, string | undefined>,
) {
  const url = new URL(path, "http://codex.local");
  url.searchParams.set("status", status);
  url.searchParams.set("message", message);

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    if (!value) {
      url.searchParams.delete(key);
      return;
    }
    url.searchParams.set(key, value);
  });

  return redirect(url.pathname + url.search + url.hash);
}
