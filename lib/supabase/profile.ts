import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type CurrentProfile = {
  userId: string | null;
  userEmail: string | null;
  username: string | null;
  displayName: string | null;
  teamName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

export async function ensureProfileForUser(user: User) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = await createClient();
  const profilePayload: {
    id: string;
    email: string | null;
    updated_at: string;
    username?: string | null;
    display_name?: string | null;
    team_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  } = {
    id: user.id,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  };

  if (typeof user.user_metadata?.username === "string") {
    profilePayload.username = user.user_metadata.username;
  }

  if (typeof user.user_metadata?.display_name === "string") {
    profilePayload.display_name = user.user_metadata.display_name;
  }

  if (typeof user.user_metadata?.team_name === "string") {
    profilePayload.team_name = user.user_metadata.team_name;
  }

  if (typeof user.user_metadata?.avatar_url === "string") {
    profilePayload.avatar_url = user.user_metadata.avatar_url;
  }

  if (typeof user.user_metadata?.bio === "string") {
    profilePayload.bio = user.user_metadata.bio;
  }

  const { error } = await supabase.from("profiles").upsert(profilePayload, {
    onConflict: "id",
  });

  if (error) {
    console.error("Failed to ensure profile row:", error.message);
  }
}

export async function getCurrentProfile(): Promise<CurrentProfile> {
  if (!hasSupabaseEnv()) {
    return {
      userId: null,
      userEmail: null,
      username: null,
      displayName: null,
      teamName: null,
      avatarUrl: null,
      bio: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      userEmail: null,
      username: null,
      displayName: null,
      teamName: null,
      avatarUrl: null,
      bio: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, team_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    username:
      typeof profile?.username === "string"
        ? profile.username
        : typeof profile?.display_name === "string"
          ? profile.display_name
          : typeof user.user_metadata?.username === "string"
            ? user.user_metadata.username
            : null,
    displayName:
      typeof profile?.display_name === "string"
        ? profile.display_name
        : typeof profile?.username === "string"
          ? profile.username
          : null,
    teamName:
      typeof profile?.team_name === "string"
        ? profile.team_name
        : typeof user.user_metadata?.team_name === "string"
          ? user.user_metadata.team_name
          : null,
    avatarUrl:
      typeof profile?.avatar_url === "string"
        ? profile.avatar_url
        : typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
    bio:
      typeof profile?.bio === "string"
        ? profile.bio
        : typeof user.user_metadata?.bio === "string"
          ? user.user_metadata.bio
          : null,
  };
}