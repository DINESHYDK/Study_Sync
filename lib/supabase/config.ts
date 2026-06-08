export const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isSupabaseConfigured =
  publicSupabaseUrl.startsWith("https://") && publicSupabaseAnonKey.length > 20;

export const isServiceRoleConfigured = isSupabaseConfigured && serviceRoleKey.length > 20;

export function publicSupabaseConfig() {
  return {
    url: isSupabaseConfigured ? publicSupabaseUrl : "https://placeholder.supabase.co",
    anonKey: isSupabaseConfigured ? publicSupabaseAnonKey : "placeholder-anon-key",
  };
}
