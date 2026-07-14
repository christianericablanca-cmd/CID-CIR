"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Globe,
  Search,
  Shield,
  ShieldCheck,
  Skull,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PORT_INFO } from "@/lib/port-info";

type PortResult = {
  port: number;
  service: string;
  status: "open" | "closed";
};

function RiskBadge({ risk }: { risk: "low" | "medium" | "high" | "critical" }) {
  const map = {
    low: { label: "Low", variant: "success" as const },
    medium: { label: "Medium", variant: "warning" as const },
    high: { label: "High", variant: "danger" as const },
    critical: { label: "Critical", variant: "danger" as const },
  };
  const m = map[risk];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function PortScannerTool() {
  const [host, setHost] = React.useState("");
  const [results, setResults] = React.useState<PortResult[] | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});

  async function scan() {
    const target = host.trim();
    if (!target) return;
    setError("");
    setResults(null);
    setExpanded({});
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("host", target);
      const res = await fetch(`/api/portscan?${params.toString()}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setResults(json.results);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(port: number) {
    setExpanded((p) => ({ ...p, [port]: !p[port] }));
  }

  const openPorts = results?.filter((r) => r.status === "open") ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="mb-2 block text-xs uppercase tracking-wider text-muted">
            Target Host
          </Label>
          <Input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="e.g. example.com or 1.1.1.1"
            onKeyDown={(e) => e.key === "Enter" && scan()}
            className="font-mono"
          />
        </div>
        <Button onClick={scan} disabled={loading}>
          <Search className="size-4" />
          {loading ? "Scanning..." : "Scan"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2">
          <Badge variant="danger">Error</Badge>
          <span className="text-sm text-danger">{error}</span>
        </div>
      )}

      {/* Summary */}
      {results && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <Globe className="size-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground">{host}</p>
              <p className="text-xs text-muted">
                {results.length} ports scanned
                {openPorts.length > 0
                  ? ` · ${openPorts.length} open`
                  : " · all closed"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-3",
              openPorts.length > 0
                ? "border-warning/30 bg-warning/5"
                : "border-success/30 bg-success/5"
            )}
          >
            {openPorts.length > 0 ? (
              <Shield className="size-5 text-warning" />
            ) : (
              <ShieldCheck className="size-5 text-success" />
            )}
            <span
              className={cn(
                "text-sm font-semibold",
                openPorts.length > 0 ? "text-warning" : "text-success"
              )}
            >
              {openPorts.length > 0 ? "Exposed" : "Secure"}
            </span>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted">
                <th className="w-8 px-2 py-2.5" />
                <th className="px-2 py-2.5 font-medium">Port</th>
                <th className="px-2 py-2.5 font-medium">Service</th>
                <th className="px-2 py-2.5 font-medium">Risk</th>
                <th className="px-2 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((r, i) => {
                const info = PORT_INFO[r.port];
                const isOpen = r.status === "open";
                const isExpanded = expanded[r.port];
                const hasInfo = !!info;

                return (
                  <React.Fragment key={i}>
                    <tr
                      className={cn(
                        "transition-colors",
                        isOpen && "bg-warning/5"
                      )}
                    >
                      <td className="px-2 py-2.5">
                        {hasInfo && (
                          <button
                            onClick={() => toggle(r.port)}
                            className="text-muted hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="font-mono font-medium text-foreground">
                          {r.port}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-muted">{r.service}</td>
                      <td className="px-2 py-2.5">
                        {info ? <RiskBadge risk={info.risk} /> : (
                          <span className="text-xs text-muted/50">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        {isOpen ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                            <Activity className="size-3" />
                            Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted/10 px-2 py-0.5 text-xs font-medium text-muted/50">
                            Closed
                          </span>
                        )}
                      </td>
                    </tr>
                    {/* Expanded details */}
                    {isExpanded && hasInfo && (
                      <tr className="bg-card">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="space-y-3 text-xs leading-relaxed">
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted/50">
                                Description
                              </span>
                              <p className="mt-0.5 text-foreground">
                                {info.description}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted/50">
                                Common Use
                              </span>
                              <p className="mt-0.5 text-foreground">{info.use}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-muted/50">
                                Attack Vectors
                              </span>
                              <ul className="mt-1 space-y-1">
                                {info.attack_vectors.map((v, j) => (
                                  <li
                                    key={j}
                                    className="flex items-start gap-2 text-muted"
                                  >
                                    <Skull className="mt-0.5 size-3 shrink-0 text-danger/60" />
                                    {v}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Note */}
      <p className="text-xs text-muted/50">
        Scans 24 common ports from our server. Click a row to see port details.
        For authorized testing only.
      </p>
    </div>
  );
}
