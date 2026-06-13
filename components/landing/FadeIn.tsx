"use client";

import { cn } from "@/lib/utils";

export function FadeIn({
  children,
  className,
  delay,
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  [key: string]: unknown;
}) {
  // Consume delay so it is not forwarded to the div and avoids unused variable warnings
  if (delay !== undefined) {
    // No-op
  }
  return (
    <div className={cn(className)} {...rest}>
      {children}
    </div>
  );
}

