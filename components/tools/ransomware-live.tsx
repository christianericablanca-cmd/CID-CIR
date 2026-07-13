"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  HardDrive,
  Link2,
  Search,
  Server,
  ShieldOff,
  Signal,
  Siren,
  Skull,
  Tag,
  Users,
  Wifi,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type QueryType = "country" | "group";
type VictimsData = Record<string, unknown>[];
type GroupData = Record<string, unknown>;

const GROUP_COLORS: Record<string, string> = {
  qilin: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  lockbit: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  lockbit3: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  lockbit5: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  thegentlemen: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  dragonforce: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  payload: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  clop: "bg-red-500/15 text-red-500 border-red-500/30",
  alphv: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  "8base": "bg-pink-500/15 text-pink-500 border-pink-500/30",
  incransom: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  medusa: "bg-teal-500/15 text-teal-500 border-teal-500/30",
  blackbyte: "bg-gray-500/15 text-gray-500 border-gray-500/30",
  ransomhouse: "bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30",
  stormous: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  hunthress: "bg-lime-500/15 text-lime-500 border-lime-500/30",
  nova: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  krybit: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  aurora: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  arcusmedia: "bg-rose-400/15 text-rose-400 border-rose-400/30",
  tengu: "bg-slate-500/15 text-slate-500 border-slate-500/30",
  devman: "bg-stone-500/15 text-stone-500 border-stone-500/30",
  nightspire: "bg-indigo-400/15 text-indigo-400 border-indigo-400/30",
  warlock: "bg-green-500/15 text-green-500 border-green-500/30",
  osiris: "bg-cyan-400/15 text-cyan-400 border-cyan-400/30",
  apt73: "bg-red-600/15 text-red-600 border-red-600/30",
};

function groupBadge(name: string) {
  const key = Object.keys(GROUP_COLORS).find(
    (k) => name.toLowerCase() === k
  );
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
    key ? GROUP_COLORS[key] : "bg-secondary text-muted border-border"
  );
}

function formatDate(raw: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBytes(raw: string | number | null) {
  if (raw == null || raw === "") return null;
  const s = String(raw);
  const m = s.match(/^[\d.]+/);
  if (!m) return s;
  const num = parseFloat(m[0]);
  if (num < 1) return null;
  if (s.toUpperCase().includes("GB")) return `${num} GB`;
  if (s.toUpperCase().includes("TB")) return `${num} TB`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} TB`;
  return `${num} GB`;
}

/* ── Group detail sub-renderers ─────────────────────────────────── */

function LocationCard({
  loc,
}: {
  loc: { fqdn?: string; slug?: string; title?: string; type?: string; available?: boolean; enabled?: boolean };
}) {
  const isAvail = loc.available;
  const isEn = loc.enabled;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
      <div
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
          isAvail
            ? "bg-success/10 text-success"
            : "bg-danger/10 text-danger"
        )}
      >
        {isAvail ? <Signal className="size-3.5" /> : <ShieldOff className="size-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {loc.title || "Unnamed"}
          </span>
          <span className="rounded border border-border bg-secondary/50 px-1.5 py-0.5 text-[10px] uppercase text-muted">
            {loc.type || "?"}
          </span>
          {isAvail && (
            <Badge
              variant="success"
              className="text-[10px] leading-none"
            >
              Available
            </Badge>
          )}
          {!isEn && (
            <Badge
              variant="danger"
              className="text-[10px] leading-none"
            >
              Disabled
            </Badge>
          )}
        </div>
        {loc.fqdn && (
          <p className="mt-0.5 truncate font-mono text-xs text-muted">
            {loc.fqdn}
          </p>
        )}
        {loc.slug && (
          <a
            href={loc.slug}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <ExternalLink className="size-3" />
            Open
          </a>
        )}
      </div>
    </div>
  );
}

function renderLocations(locations: unknown) {
  if (!Array.isArray(locations) || locations.length === 0) return null;
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        Locations ({locations.length})
      </span>
      <div className="grid gap-2 sm:grid-cols-2">
        {locations.map((loc, i) => (
          <LocationCard
            key={i}
            loc={(loc ?? {}) as {
              fqdn?: string;
              slug?: string;
              title?: string;
              type?: string;
              available?: boolean;
              enabled?: boolean;
            }}
          />
        ))}
      </div>
    </div>
  );
}

function renderTools(tools: unknown) {
  if (!Array.isArray(tools) || tools.length === 0) return null;
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        Tools &amp; Techniques
      </span>
      <div className="rounded-lg border border-border bg-card p-4">
        {tools.map((category, i) => {
          if (typeof category !== "object" || category === null)
            return null;
          const entries = Object.entries(category as Record<string, string[]>);
          return (
            <div key={i} className={i > 0 ? "mt-4 border-t border-border pt-4" : ""}>
              {entries.map(([catName, items]) => (
                <div key={catName} className="mb-3 last:mb-0">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                    {catName.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(items as string[]).map((tool, j) => (
                      <span
                        key={j}
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                          catName === "Exfiltration"
                            ? "bg-danger/10 text-danger border-danger/20"
                            : catName === "DefenseEvasion" ||
                                catName === "Defense Evasion"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : catName === "CredentialTheft" ||
                                  catName === "Credential Theft"
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                : catName === "Offsec" || catName === "C2"
                                  ? "bg-violet-500/10 text-violet-500 border-violet-500/20"
                                  : "bg-secondary text-foreground border-border"
                        )}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TTPRow({
  technique,
  defaultOpen,
}: {
  technique: Record<string, unknown>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  const details = String(technique.technique_details || "");
  const name = String(technique.technique_name || "");
  const id = String(technique.technique_id || "");
  const hasDetails = details !== "" && details !== "N/A";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/50"
      >
        {hasDetails ? (
          open ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted" />
          )
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        <span className="font-mono text-xs text-muted">{id}</span>
        <span className="text-foreground">{name}</span>
      </button>
      {hasDetails && open && (
        <div className="border-l-2 border-accent/30 ml-[22px] px-4 py-2 text-xs leading-relaxed text-muted">
          {details}
        </div>
      )}
    </div>
  );
}

function renderTTPs(ttps: unknown) {
  if (!Array.isArray(ttps) || ttps.length === 0) return null;
  return <TTPsSection ttps={ttps} />;
}

function TTPsSection({ ttps }: { ttps: Record<string, unknown>[] }) {
  const [openTactics, setOpenTactics] = React.useState<Record<number, boolean>>(
    { 0: true }
  );

  function toggleTactic(i: number) {
    setOpenTactics((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        MITRE ATT&amp;CK TTPs
      </span>
      <div className="rounded-lg border border-border bg-card">
        {ttps.map((tactic, i) => {
          const t = tactic as Record<string, unknown>;
          const tName = String(t.tactic_name || "");
          const tId = String(t.tactic_id || "");
          const techniques = (t.techniques as Record<string, unknown>[]) ?? [];
          const isOpen = openTactics[i] ?? (i === 0);

          return (
            <div
              key={i}
              className={
                i > 0 ? "border-t border-border" : ""
              }
            >
              <button
                type="button"
                onClick={() => toggleTactic(i)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/30"
              >
                {isOpen ? (
                  <ChevronDown className="size-4 shrink-0 text-muted" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted" />
                )}
                <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                  {tId}
                </span>
                <span className="font-medium text-foreground">{tName}</span>
                <span className="ml-auto text-xs text-muted">
                  {techniques.length} technique
                  {techniques.length !== 1 ? "s" : ""}
                </span>
              </button>
              {isOpen && (
                <div className="pb-2">
                  {techniques.map((tech, j) => (
                    <TTPRow key={j} technique={tech} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RansomwareLiveTool() {
  const [type, setType] = React.useState<QueryType>("country");
  const [code, setCode] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [data, setData] = React.useState<VictimsData | GroupData | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function run() {
    setError("");
    setData(null);
    const param = type === "country" ? code.trim() : group.trim();
    if (!param) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", type);
      if (type === "country") params.set("code", param);
      else params.set("name", param);

      const res = await fetch(`/api/ransomware?${params.toString()}`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Request failed.");
      } else {
        setData(json.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Query type toggle */}
      <div className="flex gap-2">
        {(["country", "group"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={type === t ? "default" : "secondary"}
            onClick={() => {
              setType(t);
              setData(null);
              setError("");
            }}
          >
            {t === "country" ? "By Country" : "By Group"}
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="mb-2 block text-xs uppercase tracking-wider text-muted">
            {type === "country" ? "Country Code" : "Group Name"}
          </Label>
          <Input
            value={type === "country" ? code : group}
            onChange={(e) =>
              type === "country"
                ? setCode(e.target.value)
                : setGroup(e.target.value)
            }
            placeholder={
              type === "country"
                ? "e.g. PH, US, DE"
                : "e.g. Conti, LockBit"
            }
            onKeyDown={(e) => e.key === "Enter" && run()}
            className="font-mono"
          />
        </div>
        <Button onClick={run} disabled={loading}>
          <Search className="size-4" />
          {loading ? "Querying..." : "Query"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2">
          <Badge variant="danger">Error</Badge>
          <span className="text-sm text-danger">{error}</span>
        </div>
      )}

      {/* Country victims table */}
      {data && type === "country" && Array.isArray(data) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Victims — {data.length} record{data.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-3 py-2 font-medium">Victim</th>
                  <th className="px-3 py-2 font-medium">Group</th>
                  <th className="px-3 py-2 font-medium">Sector</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Size</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((victim, i) => {
                  const v = victim as Record<string, unknown>;
                  const name = String(v.post_title || "");
                  const grp = String(v.group_name || "");
                  const act = String(v.activity || "");
                  const published = String(v.published || "");
                  const site = String(v.website || "");
                  const sz = String(v.data_size || "");
                  const desc = String(v.description || "");
                  const onion = String(v.post_url || "");
                  return (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-secondary/20"
                    >
                      <td className="max-w-[200px] px-3 py-2.5">
                        <div className="font-medium text-foreground truncate" title={name}>
                          {name || "—"}
                        </div>
                        {site && (
                          <a
                            href={
                              site.startsWith("http")
                                ? site
                                : `https://${site}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
                          >
                            <Link2 className="size-3" />
                            {site.length > 30
                              ? site.slice(0, 28) + "…"
                              : site}
                          </a>
                        )}
                        {desc && desc !== "N/A" && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted/70">
                            {desc.length > 120
                              ? desc.slice(0, 120) + "…"
                              : desc}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={groupBadge(grp)}>{grp}</span>
                      </td>
                      <td className="px-3 py-2.5 text-muted">{act || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {formatDate(published)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {sz ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning">
                            <HardDrive className="size-3" />
                            {sz}
                          </span>
                        ) : (
                          <span className="text-muted/50">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {onion ? (
                          <a
                            href={onion}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            Leak
                          </a>
                        ) : (
                          <span className="text-muted/50">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Group details */}
      {data && type === "group" && !Array.isArray(data) && (
        <div className="space-y-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Group Details
          </span>

          {/* Description */}
          {String(data.description || "") !== "" && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
              {String(data.description)}
            </div>
          )}

          {/* Info rows (simple fields) */}
          {(["name", "altname", "added_date"] as const).map(
            (k) =>
              data[k] != null && String(data[k]) !== "" && (
                <div
                  key={k}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <span className="min-w-[100px] text-xs font-medium uppercase tracking-wider text-muted">
                    {k.replace(/_/g, " ")}
                  </span>
                  <span className="text-foreground">
                    {k === "added_date"
                      ? formatDate(String(data[k]))
                      : String(data[k])}
                  </span>
                </div>
              )
          )}

          {/* Locations */}
          {renderLocations(data.locations)}

          {/* Tools */}
          {renderTools(data.tools)}

          {/* TTPs */}
          {renderTTPs(data.ttps)}
        </div>
      )}

      {/* External link */}
      <div className="rounded-lg border border-border bg-secondary/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <Siren className="size-5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Ransomware.live
            </p>
            <p className="text-xs text-muted">
              Real-time ransomware tracking, leak site monitoring, and threat
              group intelligence.
            </p>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <a
              href="https://www.ransomware.live/"
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
