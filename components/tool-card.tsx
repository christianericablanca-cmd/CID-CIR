"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import type { ToolDef } from "@/lib/tools";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ToolCard({ tool }: { tool: ToolDef }) {
  const Icon = tool.icon;
  const isExternal = tool.type === "external";

  const content = (
    <div className="flex h-full items-center gap-4 border border-border bg-card px-5 py-4 transition-colors hover:border-accent/60 hover:bg-card/80">
      <div className="flex size-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
        <Icon className="size-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {tool.name}
          </h3>
          <Badge
            variant={isExternal ? "secondary" : "default"}
            className="shrink-0 text-[10px] uppercase tracking-wider"
          >
            {tool.scope}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {tool.description}
        </p>
      </div>

      <div className="shrink-0 text-muted transition-colors group-hover:text-accent">
        {isExternal ? (
          <ExternalLink className="size-4" />
        ) : (
          <ArrowUpRight className="size-4" />
        )}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return <Link href={tool.route!}>{content}</Link>;
}
