import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";

import { AppProviders } from "@/components/providers/AppProviders";
import { STUDYSYNC_PUBLIC_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "StudySync",
    template: "%s | StudySync",
  },
  description: "Track your study sessions. Compete with friends.",
  metadataBase: new URL(STUDYSYNC_PUBLIC_URL),
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StudySync",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "StudySync",
    description: "Track your study sessions. Compete with friends.",
    url: STUDYSYNC_PUBLIC_URL,
    siteName: "StudySync",
    locale: "en_US",
    type: "website",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudySync",
    description: "Track your study sessions. Compete with friends.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.variable, spaceGrotesk.variable, jetBrainsMono.variable, "min-h-screen font-body antialiased")}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
