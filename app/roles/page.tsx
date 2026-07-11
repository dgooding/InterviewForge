"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Briefcase, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { JOB_ROLES } from "@/lib/roles";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RolesPage() {
  const router = useRouter();
  const { selectedRole, setSelectedRole, setUser, user } = useApp();
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return JOB_ROLES.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [search]);

  const categories = useMemo(
    () => Array.from(new Set(filtered.map((r) => r.category))),
    [filtered]
  );

  const select = (title: string) => {
    setSelectedRole(title);
    if (user) {
      setUser({ ...user, preferredRole: title });
    }
    toast.success(`Target role set: ${title}`);
  };

  const selectCustom = () => {
    const t = custom.trim();
    if (!t) {
      toast.error("Enter a custom role title");
      return;
    }
    select(t);
    setCustom("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Job Role Selector</h1>
            <p className="mt-1 text-muted-foreground">
              Choose a target role so questions and feedback stay relevant.
            </p>
          </div>
          {selectedRole && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <Check className="h-3.5 w-3.5" />
              Selected: {selectedRole}
            </Badge>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search roles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Custom role…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && selectCustom()}
            />
            <Button variant="outline" onClick={selectCustom}>
              Add
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered
                  .filter((r) => r.category === cat)
                  .map((role) => {
                    const active = selectedRole === role.title;
                    return (
                      <Card
                        key={role.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          active && "border-primary shadow-glow ring-1 ring-primary/30"
                        )}
                        onClick={() => select(role.title)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Briefcase className="h-4 w-4 text-primary" />
                              {role.title}
                            </CardTitle>
                            {role.popular && (
                              <Badge variant="secondary" className="shrink-0 gap-1">
                                <Sparkles className="h-3 w-3" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{role.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {active ? (
                            <span className="text-xs font-medium text-primary">
                              Currently selected
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Click to select
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {selectedRole && (
          <div className="mt-10 flex justify-center">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => router.push("/interview")}
            >
              Continue to interview
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
