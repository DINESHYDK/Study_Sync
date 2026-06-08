"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient, type BrowserSupabaseClient } from "@/lib/supabase/client";
import { demoProfile, useUserStore, type UserProfile } from "@/stores/useUserStore";

type SupabaseContextValue = {
  supabase: BrowserSupabaseClient;
  isConfigured: boolean;
  isReady: boolean;
  sessionUser: User | null;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

async function fetchProfile(supabase: BrowserSupabaseClient, user: User) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error) {
    const fallbackProfile: UserProfile = {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata.full_name?.toString() ?? "",
      initials: user.email?.slice(0, 1).toUpperCase() ?? "U",
      avatar_id: null,
      referral_code: "PENDING",
      onboarding_done: false,
      created_at: new Date().toISOString(),
    };

    return fallbackProfile;
  }

  return data;
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isReady, setLocalReady] = useState(false);
  const [sessionUser, setLocalSessionUser] = useState<User | null>(null);
  const setProfile = useUserStore((state) => state.setProfile);
  const setSessionUser = useUserStore((state) => state.setSessionUser);
  const setReady = useUserStore((state) => state.setReady);
  const resetUser = useUserStore((state) => state.reset);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      if (!isSupabaseConfigured) {
        setProfile(demoProfile);
        setSessionUser(null);
        setLocalSessionUser(null);
        setLocalReady(true);
        setReady(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      const user = session?.user ?? null;
      setLocalSessionUser(user);
      setSessionUser(user);

      if (user) {
        const profile = await fetchProfile(supabase, user);

        if (isMounted) {
          setProfile(profile);
        }
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLocalReady(true);
        setReady(true);
      }
    }

    initialize().catch(() => {
      if (isMounted) {
        setLocalReady(true);
        setReady(true);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setLocalSessionUser(user);
      setSessionUser(user);

      if (!user) {
        resetUser();
        return;
      }

      fetchProfile(supabase, user)
        .then((profile) => setProfile(profile))
        .catch(() => setProfile(null));
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [resetUser, setProfile, setReady, setSessionUser, supabase]);

  const value = useMemo(
    () => ({
      supabase,
      isConfigured: isSupabaseConfigured,
      isReady,
      sessionUser,
    }),
    [isReady, sessionUser, supabase],
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }

  return context;
}
