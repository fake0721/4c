import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { ensureProfileForUser } from "@/lib/supabase/profile";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(
      new URL("/?status=error&message=Supabase%20%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E5%B0%9A%E6%9C%AA%E9%85%8D%E7%BD%AE", request.url),
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      await ensureProfileForUser(data.user);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
