"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Github, Moon, Search, Shield, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useSearch } from "@/components/search-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GITHUB_URL = "https://github.com";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { query, setQuery } = useSearch();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  function handleSearchChange(value: string) {
    setQuery(value);
    if (!isHome) router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-white shadow-sm">
            <Shield className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="hidden sm:block text-sm font-bold tracking-tight leading-tight">
              CID — OSINT & Security Toolkit
            </span>
            <span className="sm:hidden text-sm font-bold tracking-tight leading-tight">
              CID Toolkit
            </span>
            <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
              OSINT & SECURITY
            </span>
          </div>
        </Link>

        <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tools..."
            className="pl-9 h-9 text-xs"
            aria-label="Search tools"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild aria-label="GitHub">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="size-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          <Button variant="ghost" size="sm" asChild className={cn("text-xs", !isHome && "bg-secondary/60")}>
            <Link href="/about">About</Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tools..."
            className="pl-9 h-9 text-xs"
            aria-label="Search tools"
          />
        </div>
      </div>
    </header>
  );
}
