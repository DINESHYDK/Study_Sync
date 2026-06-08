import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  isServiceRoleConfigured,
  publicSupabaseConfig,
  publicSupabaseUrl,
  serviceRoleKey,
} from "@/lib/supabase/config";
import type { Database } from "@/types/database";

type SupabaseServiceClient = ReturnType<typeof createSupabaseJsClient<Database>>;

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const { url, anonKey } = publicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot always set cookies; middleware handles refresh.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server Components cannot always set cookies; middleware handles refresh.
        }
      },
    },
  });
}

export function createSupabaseServiceClient(): SupabaseServiceClient | null {
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
