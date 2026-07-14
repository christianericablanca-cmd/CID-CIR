"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Globe,
  Search,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Result = {
  ok: boolean;
  status?: number;
  statusText?: string;
  ms?: number;
  redirected?: boolean;
  url?: string;
  error?: string;
};

export function DownCheckerTool() {
  const [input, setInput] = React.useState("");
  const [result, setResult] = React.useState<Result | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function run() {
    const target = input.trim();
    if (!target) return;
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/downcheck?url=${encodeURIComponent(target)}`);
      const json = await res.json();
      if (json.error && !json.ok) {
        setError(json.error);
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="mb-2 block text-xs uppercase tracking-wider text-muted">
            Website URL
          </Label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. google.com or https://example.com"
            onKeyDown={(e) => e.key === "Enter" && run()}
            className="font-mono"
          />
        </div>
        <Button onClick={run} disabled={loading}>
          <Search className="size-4" />
          {loading ? "Checking..." : "Check"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2">
          <Badge variant="danger">Error</Badge>
          <span className="text-sm text-danger">{error}</span>
        </div>
      )}

      {result && (
        <Card className="divide-y divide-border">
          {/* Status */}
          <div className="flex items-center gap-4 px-5 py-4">
            {result.ok ? (
              <div className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="size-5" />
              </div>
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                <XCircle className="size-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {result.ok ? "Website is reachable" : "Website appears down"}
              </p>
              <p className="text-xs text-muted">
                HTTP {result.status || "—"} {result.statusText || ""}
                {result.ms != null && ` · ${result.ms}ms`}
              </p>
            </div>
            <Badge
              className="ml-auto"
              variant={result.ok ? "success" : "danger"}
            >
              {result.ok ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* Details */}
          <div className="grid gap-3 px-5 py-4 text-xs sm:grid-cols-2">
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-muted/50">
                Status Code
              </span>
              <span className="font-mono text-foreground">
                {result.status || "—"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-muted/50">
                Response Time
              </span>
              <span className="font-mono text-foreground">
                {result.ms != null ? `${result.ms}ms` : "—"}
              </span>
            </div>
            {result.redirected && (
              <div className="sm:col-span-2">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-muted/50">
                  Redirected To
                </span>
                <span className="break-all font-mono text-foreground">
                  {result.url}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* External link */}
      <div className="rounded-lg border border-border bg-secondary/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Is It Down Right Now
            </p>
            <p className="text-xs text-muted">
              Alternative external service — check if a site is globally down.
            </p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <a
              href="https://www.isitdownrightnow.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              Open
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
