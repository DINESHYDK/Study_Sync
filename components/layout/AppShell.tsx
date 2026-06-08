"use client";

import { BookOpenCheck, Clock3, LogOut, Menu, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { SubjectNameModal } from "@/components/modals/SubjectNameModal";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { TimerPopup } from "@/components/timer/TimerPopup";
import { TimerFullscreen } from "@/components/timer/TimerFullscreen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFriends } from "@/hooks/useFriends";
import { useRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/useUserStore";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Clock3 },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase, isConfigured, isReady, sessionUser } = useSupabase();
  const profile = useUserStore((state) => state.profile);
  const pendingRequestCount = useUserStore((state) => state.pendingRequestCount);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const { loadFriends, loadIncomingRequests } = useFriends();

  useRealtime();

  useEffect(() => {
    if (isConfigured && isReady && !sessionUser) {
      router.replace("/login");
    }
  }, [isConfigured, isReady, router, sessionUser]);

  useEffect(() => {
    if (profile) {
      void Promise.all([loadFriends(), loadIncomingRequests()]);
    }
  }, [loadFriends, loadIncomingRequests, profile]);

  async function handleLogout() {
    if (isConfigured) {
      await supabase.auth.signOut();
    }

    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-[#101018]/95 px-4 py-5 backdrop-blur">
      <Link className="flex items-center px-2 py-2" href="/dashboard" onClick={() => setMobileOpen(false)}>
        <Logo size={36} showText={true} />
      </Link>

      <Separator className="my-5" />

      <nav className="grid gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                isActive && "bg-secondary text-foreground",
              )}
              href={item.href}
              key={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.href === "/settings" && pendingRequestCount > 0 ? (
                <Badge variant="warning">{pendingRequestCount}</Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-4">
        {profile ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <UserAvatar profile={profile} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{profile.full_name || "StudySync User"}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>
        ) : null}
        <Button className="justify-start" onClick={handleLogout} variant="ghost">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
      <div className="hidden lg:block sticky top-0 h-screen">{sidebar}</div>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link className="flex items-center" href="/dashboard">
          <Logo size={28} showText={true} />
        </Link>
        <Button onClick={() => setMobileOpen((value) => !value)} size="icon" variant="ghost">
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle navigation</span>
        </Button>
      </div>

      {isMobileOpen ? <div className="fixed inset-0 z-50 bg-background lg:hidden">{sidebar}</div> : null}

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <TimerPopup />
      <TimerFullscreen />
      <SubjectNameModal />
      <OnboardingModal />
    </div>
  );
}
