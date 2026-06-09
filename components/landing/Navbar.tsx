"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { landingPalette } from "@/components/landing/palette";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#compare", label: "Compare" },
] as const;

export function Navbar() {
  const { isConfigured, sessionUser } = useSupabase();
  const isLoggedIn = isConfigured && Boolean(sessionUser);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-strong)] bg-[#0a0a0f]/80 backdrop-blur-md">
      {isLoggedIn ? (
        <div className="border-b border-[var(--border-strong)] bg-[var(--surface)]/80 px-4 py-2 text-center text-sm text-[var(--text-muted)]">
          You&apos;re logged in
          <Button asChild className={cn("ml-3 h-8 px-3", landingPalette.softGradient)} size="sm" variant="secondary">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      ) : null}
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-16">
        <Link aria-label="StudySync home" href="/">
          <Logo size={32} />
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button asChild key={link.href} size="sm" variant="ghost">
              <a href={link.href}>{link.label}</a>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex" variant="ghost">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild className={landingPalette.softGradient} variant="secondary">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
