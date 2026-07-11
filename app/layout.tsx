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
    default: "InterviewForge — stop bombing interviews",
    template: "%s | InterviewForge",
  },
  description:
    "Chill interview practice that keeps it honest. Mock rounds, resume tea, stats, and feedback that doesn't sound like a robot HR intern.",
  keywords: [
    "interview prep",
    "mock interview",
    "STAR method",
    "resume analysis",
    "behavioral interview",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "InterviewForge — stop bombing interviews",
    description:
      "Practice out loud, get blunt feedback, keep your progress private until you say otherwise.",
    url: siteUrl,
    siteName: "InterviewForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewForge",
    description: "Interview practice without the corporate cringe.",
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
