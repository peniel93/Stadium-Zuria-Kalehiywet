import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseAdminConfig,
  isSupabaseAdminConfigured,
} from "@/lib/config/env";

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const { url, serviceRoleKey } = getSupabaseAdminConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
