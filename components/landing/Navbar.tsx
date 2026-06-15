"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

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
  const [isScrolled, setIsScrolled] = useState(false);

  if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollToPlugin);
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // init
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    gsap.to(window, {
      duration: 1,
      scrollTo: { y: href, offsetY: 64 },
      ease: "power3.inOut",
    });
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", href);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex w-full justify-center pointer-events-none">
      <div 
        className={cn(
          "pointer-events-auto flex flex-col overflow-hidden backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-top",
          isScrolled
            ? "translate-y-4 w-[calc(100%-2rem)] max-w-[896px] rounded-full border border-[var(--border-strong)] bg-[#0a0a0f]/95 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
            : "translate-y-0 w-full max-w-[100vw] rounded-none border-b border-[var(--border-strong)] bg-[#0a0a0f]/80"
        )}
      >
        <div 
          className={cn(
            "transition-all duration-500", 
            isScrolled ? "h-0 opacity-0" : "h-auto opacity-100"
          )}
        >
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
        </div>

        <nav 
          className={cn(
            "mx-auto flex h-16 w-full items-center justify-between transition-all duration-500 px-6 md:px-8",
            !isScrolled && "max-w-7xl"
          )}
        >
          <Link aria-label="StudySync home" href="/">
            <Logo size={32} />
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button asChild key={link.href} size="sm" variant="ghost" className={isScrolled ? "hover:bg-white/5" : ""}>
                <a href={link.href} onClick={(e) => handleNavClick(e, link.href)}>{link.label}</a>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden sm:inline-flex" variant="ghost">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className={cn("rounded-full", landingPalette.softGradient)} variant="secondary">
              <Link href="/signup">
                {isScrolled ? "Start Free" : "Get Started Free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
