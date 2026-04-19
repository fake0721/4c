import { createClient } from "@/lib/supabase/server-client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export type AccountPageData = {
  profile: {
    username: string;
    displayName: string;
    teamName: string;
    avatarUrl: string;
    bio: string;
    updatedAt: string;
    email: string;
  };
};

const EMPTY_ACCOUNT_DATA: AccountPageData = {
  profile: {
    username: "",
    displayName: "",
    teamName: "",
    avatarUrl: "",
    bio: "",
    updatedAt: "",
    email: "",
  },
};

export async function getAccountPageData(): Promise<AccountPageData> {
  if (!hasSupabaseEnv()) {
    return EMPTY_ACCOUNT_DATA;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_ACCOUNT_DATA;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, team_name, avatar_url, bio, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    profile: {
      username: profile?.username ?? profile?.display_name ?? "",
      displayName: profile?.display_name ?? profile?.username ?? "",
      teamName: profile?.team_name ?? "",
      avatarUrl: profile?.avatar_url ?? "",
      bio: profile?.bio ?? "",
      updatedAt: profile?.updated_at ?? "",
      email: user.email ?? "",
    },
  };
}
