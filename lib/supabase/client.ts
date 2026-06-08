"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

import { publicSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export type BrowserSupabaseClient = SupabaseClient<Database>;

let browserClient: BrowserSupabaseClient | null = null;

export function createSupabaseBrowserClient(): BrowserSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = publicSupabaseConfig();
  const client = createBrowserClient(url, anonKey) as unknown as BrowserSupabaseClient;
  browserClient = client;

  return client;
}
