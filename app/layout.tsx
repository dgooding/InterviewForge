import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "InterviewForge — Master Any Interview with AI",
  description:
    "AI-powered job interview prep platform. Practice behavioral, technical, and company-specific interviews with instant feedback.",
  keywords: [
    "interview prep",
    "AI interview coach",
    "mock interview",
    "job interview practice",
    "STAR method",
  ],
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
          <div className="relative min-h-screen">
            <div className="pointer-events-none fixed inset-0 gradient-mesh" />
            <Navbar />
            <main className="relative">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
