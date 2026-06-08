"use client";

import { createBrowserClient } from "@supabase/ssr";

import { publicSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let browserClient: BrowserSupabaseClient | null = null;

export function createSupabaseBrowserClient(): BrowserSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = publicSupabaseConfig();
  browserClient = createBrowserClient<Database>(url, anonKey);

  return browserClient;
}
