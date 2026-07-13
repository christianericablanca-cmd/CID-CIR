"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Globe,
  Menu,
  Search,
  Shield,
  X,
} from "lucide-react";
import type { ToolDef, CategoryDef } from "@/lib/tools";
import {
  CATEGORIES,
  filterTools,
  getToolBySlug,
} from "@/lib/tools";
import { TOOL_REGISTRY } from "@/components/tools/registry";
import { useSearch } from "@/components/search-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function SidebarNav({
  groups,
  selected,
  collapsed,
  onToggleCollapse,
  onSelect,
  layoutIdPrefix = "",
}: {
  groups: { category: CategoryDef; tools: ToolDef[] }[];
  selected: string | null;
  collapsed: Record<string, boolean>;
  onToggleCollapse: (id: string) => void;
  onSelect: (slug: string) => void;
  layoutIdPrefix?: string;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      {groups.length === 0 && (
        <p className="px-2 text-xs text-muted/60">No tools match your filter.</p>
      )}
      {groups.map(({ category, tools }) => {
        const isCollapsed = collapsed[category.id];
        return (
          <div key={category.id} className="mb-0.5">
            <button
              onClick={() => onToggleCollapse(category.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                isCollapsed ? "text-muted/50" : "text-muted hover:text-foreground"
              )}
            >
              <ChevronDown
                className={cn(
                  "size-3 shrink-0 transition-transform duration-200",
                  isCollapsed && "-rotate-90"
                )}
              />
              <span className="truncate">{category.label}</span>
              <span className="ml-auto text-[10px] text-muted/40">{tools.length}</span>
            </button>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-1 space-y-[1px] pb-1">
                    {tools.map((tool) => {
                      const isActive = selected === tool.slug;
                      return (
                        <button
                          key={tool.slug}
                          onClick={() => onSelect(tool.slug)}
                          className={cn(
                            "group relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-all duration-150",
                            isActive
                              ? "bg-accent/10 text-accent font-medium"
                              : "text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId={`activeTab${layoutIdPrefix}`}
                              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-accent"
                            />
                          )}
                          <tool.icon className="size-3.5 shrink-0" />
                          <span className="truncate">{tool.name}</span>
                          {tool.type === "external" && (
                            <ExternalLink className="ml-auto size-3 shrink-0 text-muted/40 group-hover:text-muted/70" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}



export default function HomePage() {
  const { query, setQuery } = useSearch();
  const [selected, setSelected] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [showLeft, setShowLeft] = React.useState(false);

  const filtered = React.useMemo(() => filterTools(query), [query]);

  const grouped = React.useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      tools: filtered.filter((t) => t.category === category.id),
    })).filter((g) => g.tools.length > 0);
  }, [filtered]);

  const midIdx = Math.ceil(grouped.length / 2);
  const leftGroups = grouped.slice(0, midIdx);
  const rightGroups = grouped.slice(midIdx);

  const selectedTool = selected ? getToolBySlug(selected) : null;

  function toggleCollapse(id: string) {
    setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  }

  function selectTool(slug: string) {
    setSelected(slug);
    setShowLeft(false);
  }

  function deselectTool() {
    setSelected(null);
  }

  return (
    <div className="mx-auto flex max-w-[1600px]">
      {/* Hamburger toggle (mobile) */}
      <button
        onClick={() => setShowLeft(true)}
        className="fixed left-4 top-20 z-30 flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted shadow-sm lg:hidden"
      >
        <Menu className="size-4" />
      </button>

      {/* Left overlay */}
      {showLeft && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setShowLeft(false)}
        />
      )}

      {/* ── Left Sidebar ─────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-background shadow-xl shadow-black/20 transition-transform duration-300 lg:sticky lg:top-16 lg:z-0 lg:block lg:h-[calc(100vh-4rem)] lg:shadow-none",
          showLeft ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">Tools</span>
            <button onClick={() => setShowLeft(false)} className="text-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>

          <div className="hidden border-b border-border/60 px-4 py-3 lg:block">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
                <Shield className="size-4" />
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight text-foreground">CIR</p>
                <p className="text-[10px] leading-tight text-muted">CID Centralized Investigation Repository</p>
              </div>
            </div>
          </div>

          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter tools..."
                className="h-8 border-border/60 pl-8 text-xs"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted/50 hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          <SidebarNav
            groups={leftGroups}
            selected={selected}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onSelect={selectTool}
            layoutIdPrefix="L"
          />

          <div className="border-t border-border/60 px-3 py-2">
            <button
              onClick={() => { deselectTool(); setQuery(""); }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs transition-all",
                !selected
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-muted hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <Shield className="size-3.5" />
              Overview
            </button>
          </div>
        </div>
      </aside>

      {/* ── Center Workspace ─────────────────────────────────────── */}
      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-gradient-to-b from-transparent via-secondary/[0.02] to-transparent">
        <AnimatePresence mode="wait">
          {!selected || !selectedTool ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-12"
            >
              <div className="mb-6 inline-flex items-center justify-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent shadow-lg shadow-accent/10 ring-1 ring-accent/10">
                  <Shield className="size-8" />
                </div>
              </div>
              <h1 className="text-center text-2xl font-bold tracking-tight text-foreground">
                CID Centralized Investigation Repository
              </h1>
              <p className="mt-3 text-center text-sm leading-relaxed text-muted">
                Select a tool from either sidebar to begin. All processing happens locally in your browser.
              </p>
              <button
                onClick={() => setShowLeft(true)}
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70 lg:hidden"
              >
                <Menu className="size-3.5" />
                Browse tools
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-1 flex-col"
            >
              {(() => {
                const tool = selectedTool;
                const ToolComponent = TOOL_REGISTRY[tool.slug];
                const Icon = tool.icon;
                const isExternal = tool.type === "external";
                return (
                  <>
                    {/* Workspace */}
                    <div className="flex-1 p-5 sm:p-8">
                      <div className="mx-auto max-w-5xl">
                        <div className="mb-8 flex items-start gap-4">
                          <button
                            onClick={deselectTool}
                            className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-secondary/60 hover:text-foreground"
                          >
                            <ArrowRight className="size-3 rotate-180" />
                            Back
                          </button>
                          <span className="mt-1 text-muted/30">|</span>
                          <Icon className="mt-1 size-6 text-accent" />
                          <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                              {tool.name}
                            </h1>
                            <p className="mt-1 text-sm leading-relaxed text-muted">
                              {tool.description}
                            </p>
                          </div>
                        </div>

                        {isExternal ? (
                          <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-border bg-card px-6 py-20 text-center">
                            <div className="flex size-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                              <Icon className="size-7" />
                            </div>
                            <div className="max-w-sm">
                              <p className="text-sm leading-relaxed text-muted">{tool.description}</p>
                            </div>
                            <Button asChild className="gap-2">
                              <a href={tool.url} target="_blank" rel="noopener noreferrer">
                                Open {tool.name}
                                <ExternalLink className="size-4" />
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                            <ToolComponent />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Tool Info (below workspace) ────────────── */}
                    <div className="border-t border-border/60 bg-secondary/20 px-5 py-4 sm:px-8">
                      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted/50">Type</span>
                          <Badge variant={isExternal ? "secondary" : "default"} className="text-[10px] uppercase tracking-wider">
                            {tool.scope}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-muted/50">Category</span>
                          <span className="text-foreground">
                            {CATEGORIES.find((c) => c.id === tool.category)?.label || tool.category}
                          </span>
                        </div>
                        {tool.type === "external" && tool.url && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-muted/50">URL</span>
                            <a
                              href={tool.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-accent transition-colors hover:text-accent/80"
                            >
                              <Globe className="size-3" />
                              {tool.url.replace(/^https?:\/\//, "")}
                              <ExternalLink className="size-3" />
                            </a>
                          </div>
                        )}
                        <p className="ml-auto hidden text-muted/60 sm:block">{tool.description}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Right Sidebar (tools) ────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 border-l border-border bg-background lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)]">
        <div className="flex h-full flex-col">
          <div className="border-b border-border/60 px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/60">
              Tools
            </span>
          </div>
          <SidebarNav
            groups={rightGroups}
            selected={selected}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapse}
            onSelect={selectTool}
            layoutIdPrefix="R"
          />
        </div>
      </aside>
    </div>
  );
}
