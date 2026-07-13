"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OutputArea } from "@/components/output-area";

const FIELDS: { key: string; label: string; placeholder: string; wrap?: string }[] = [
  { key: "all", label: "All these words", placeholder: "invoice payment" },
  { key: "phrase", label: "Exact phrase", placeholder: "confidential report", wrap: '"' },
  { key: "any", label: "Any of these", placeholder: "login admin", wrap: "" },
  { key: "none", label: "None of these", placeholder: "spam", wrap: "-" },
  { key: "site", label: "Site", placeholder: "example.com", wrap: "site:" },
  { key: "filetype", label: "File type", placeholder: "pdf", wrap: "filetype:" },
  { key: "inurl", label: "In URL", placeholder: "admin", wrap: "inurl:" },
  { key: "intitle", label: "In title", placeholder: "index of", wrap: "intitle:" },
  { key: "intext", label: "In text", placeholder: "password", wrap: "intext:" },
  { key: "before", label: "Before (date)", placeholder: "2020-01-01", wrap: "before:" },
  { key: "after", label: "After (date)", placeholder: "2023-01-01", wrap: "after:" },
];

export function GoogleDorkTool() {
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [extra, setExtra] = React.useState("");

  const query = React.useMemo(() => {
    const parts: string[] = [];
    const v = (k: string) => values[k]?.trim();
    if (v("all")) parts.push(v("all")!);
    if (v("phrase")) parts.push(`"${v("phrase")}"`);
    if (v("any")) parts.push(`(${v("any")!.split(/\s+/).join(" OR ")})`);
    if (v("none")) parts.push(`-${v("none")}`);
    ["site", "filetype", "inurl", "intitle", "intext", "before", "after"].forEach(
      (k) => {
        const f = FIELDS.find((x) => x.key === k)!;
        if (v(k)) parts.push(`${f.wrap}${v(k)}`);
      }
    );
    if (extra.trim()) parts.push(extra.trim());
    return parts.join(" ");
  }, [values, extra]);

  const url = query
    ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
    : "";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="mb-2 block">{f.label}</Label>
            <Input
              value={values[f.key] || ""}
              onChange={(e) =>
                setValues((s) => ({ ...s, [f.key]: e.target.value }))
              }
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>
      <div>
        <Label className="mb-2 block">Additional operators</Label>
        <Input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="link:example.com, related:example.com, cache:example.com"
        />
      </div>
      <OutputArea label="Google Dork Query" value={query} downloadName="dork.txt" />
      {url && (
        <Button asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Run Google Search
          </a>
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setValues({});
          setExtra("");
        }}
      >
        Clear
      </Button>
    </div>
  );
}
