"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/components/providers";
import { Loader2 } from "lucide-react";

const PUBLIC = ["/", "/login", "/signup"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    const isPublic = PUBLIC.includes(pathname);
    if (!user && !isPublic) {
      router.replace("/login");
    }
    if (user && (pathname === "/login" || pathname === "/signup")) {
      router.replace("/dashboard");
    }
  }, [user, hydrated, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPublic = PUBLIC.includes(pathname);
  if (!user && !isPublic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
