import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  isServiceRoleConfigured,
  publicSupabaseConfig,
  publicSupabaseUrl,
  serviceRoleKey,
} from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const { url, anonKey } = publicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot always set cookies; middleware handles refresh.
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot always set cookies; middleware handles refresh.
        }
      },
    },
  });
}

export function createSupabaseServiceClient(): SupabaseClient<Database> | null {
  if (!isServiceRoleConfigured) {
    return null;
  }

  return createSupabaseJsClient<Database>(publicSupabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
