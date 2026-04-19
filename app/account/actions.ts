"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateProfileAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return encodedRedirect("error", "/dashboard/account", "Supabase is not configured.");
  }

  const username = getTrimmedValue(formData, "username");
  const displayName = getTrimmedValue(formData, "displayName") || username;
  const bio = getTrimmedValue(formData, "bio");
  const avatarUrl = getTrimmedValue(formData, "avatarUrl");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect("error", "/", "Please sign in before updating your profile.");
  }

  const profilePayload: {
    id: string;
    email: string | null;
    updated_at: string;
    username?: string | null;
    display_name?: string | null;
    team_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  } = {
    id: user.id,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  };

  profilePayload.username = username || null;
  profilePayload.display_name = displayName || null;
  profilePayload.bio = bio || null;
  profilePayload.avatar_url = avatarUrl || null;

  if (formData.has("teamName")) {
    const teamName = getTrimmedValue(formData, "teamName");
    profilePayload.team_name = teamName || null;
  }

  const { error } = await supabase.from("profiles").upsert(profilePayload);

  if (error) {
    return encodedRedirect("error", "/dashboard/account", error.message);
  }

  return encodedRedirect("success", "/dashboard/account", "Profile updated successfully.");
}