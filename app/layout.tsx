import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { OnboardingModal } from "@/components/onboarding";
import { KeyboardHints } from "@/components/keyboard-hints";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://interviewforge-zeta.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "InterviewForge — Master Any Interview with AI",
    template: "%s | InterviewForge",
  },
  description:
    "AI-powered job interview prep: mock interviews, resume intelligence, analytics, and private progress tracking. Practice behavioral, technical, and company-style questions.",
  keywords: [
    "interview prep",
    "AI interview coach",
    "mock interview",
    "STAR method",
    "resume analysis",
    "behavioral interview",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "InterviewForge — Master Any Interview with AI",
    description:
      "Practice interviews with AI feedback, resume insights, and progress that stays private until you sync.",
    url: siteUrl,
    siteName: "InterviewForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewForge",
    description: "AI interview coaching for candidates who want to walk in ready.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none fixed inset-0 gradient-mesh" />
            <Navbar />
            <main className="relative flex-1">{children}</main>
            <SiteFooter />
            <OnboardingModal />
            <KeyboardHints />
          </div>
        </Providers>
      </body>
    </html>
  );
}
