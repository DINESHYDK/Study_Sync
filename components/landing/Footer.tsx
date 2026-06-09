import Link from "next/link";

import { Logo } from "@/components/Logo";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "/signup", label: "Sign Up" },
  { href: "/login", label: "Log In" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-strong)] px-4 py-8 md:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
        <div>
          <Logo size={30} />
          <p className="mt-2">Study hard. Study together.</p>
        </div>
        <nav className="flex flex-wrap gap-4">
          {links.map((link) =>
            link.href.startsWith("#") ? (
              <a className="hover:text-foreground" href={link.href} key={link.href}>
                {link.label}
              </a>
            ) : (
              <Link className="hover:text-foreground" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <p>&copy; 2026 StudySync</p>
      </div>
    </footer>
  );
}
