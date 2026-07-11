"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, Check, X } from "lucide-react";
import { JOB_ROLES, searchRoles } from "@/lib/roles";
import type { JobRole } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RoleSearchProps = {
  value?: string | null;
  onSelect: (title: string) => void;
  placeholder?: string;
  className?: string;
  /** Show dropdown of matches while typing */
  autoFocus?: boolean;
  id?: string;
};

/**
 * Searchable role picker used on interview hub, mode sessions, and anywhere
 * a "search bubble" should resolve roles (including IT Service Desk, etc.).
 */
export function RoleSearch({
  value,
  onSelect,
  placeholder = "Search roles (e.g. IT Service Desk, Frontend…)",
  className,
  autoFocus,
  id,
}: RoleSearchProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const matches = useMemo(() => searchRoles(query, 10), [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const pick = (title: string) => {
    onSelect(title);
    setQuery("");
    setOpen(false);
  };

  const applyCustomRole = () => {
    const t = query.trim();
    if (!t) return;
    pick(t);
  };

  const onKeyDown = (e: {
    key: string;
    preventDefault: () => void;
  }) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(matches.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && matches[highlight]) {
        pick(matches[highlight].title);
      } else if (query.trim()) {
        applyCustomRole();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search target role"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="h-11 rounded-xl border-indigo-500/20 bg-card/90 pl-10 pr-9 shadow-sm focus-visible:border-indigo-500/40"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {
              setQuery("");
              setOpen(true);
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-indigo-500/20 bg-card py-1 shadow-xl shadow-indigo-500/10"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">
              Nothing in the list matched.{" "}
              {query.trim() ? (
                <button
                  type="button"
                  className="font-medium text-indigo-600 underline dark:text-indigo-300"
                  onClick={applyCustomRole}
                >
                  Use “{query.trim()}” as a custom role
                </button>
              ) : (
                "Start typing, fr."
              )}
            </li>
          ) : (
            matches.map((role, i) => (
              <RoleOption
                key={role.id}
                role={role}
                active={value === role.title}
                highlighted={i === highlight}
                onPick={() => pick(role.title)}
                onHover={() => setHighlight(i)}
              />
            ))
          )}
          {query.trim() &&
            !matches.some(
              (m) => m.title.toLowerCase() === query.trim().toLowerCase()
            ) &&
            matches.length > 0 && (
              <li className="border-t border-border/60">
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300"
                  onClick={applyCustomRole}
                >
                  Custom role: “{query.trim()}”
                </button>
              </li>
            )}
        </ul>
      )}

      {value && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Locked in:{" "}
          <span className="font-semibold text-foreground">{value}</span>
          {!JOB_ROLES.some((r) => r.title === value) && (
            <span className="text-muted-foreground"> (custom)</span>
          )}
        </p>
      )}
    </div>
  );
}

function RoleOption({
  role,
  active,
  highlighted,
  onPick,
  onHover,
}: {
  role: JobRole;
  active: boolean;
  highlighted: boolean;
  onPick: () => void;
  onHover: () => void;
}) {
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        className={cn(
          "flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors",
          highlighted || active
            ? "bg-indigo-500/10 text-foreground"
            : "hover:bg-muted/80"
        )}
        onMouseEnter={onHover}
        onClick={onPick}
      >
        <span className="min-w-0 flex-1">
          <span className="font-medium">{role.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {role.category} · {role.description}
          </span>
        </span>
        {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />}
      </button>
    </li>
  );
}
