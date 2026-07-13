"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Rule {
  id: string;
  label: string;
  test: RegExp;
  apply: (s: string) => string;
}

const RULES: Rule[] = [
  {
    id: "http",
    label: "Restore hxxp → http",
    test: /hxxp/i,
    apply: (s) =>
      s.replace(/hxxps?/gi, (m) => (m.startsWith("s") || m.startsWith("S") ? "https" : "http")),
  },
  {
    id: "colon",
    label: "Restore [://] → ://",
    test: /\[:\/\/\]/,
    apply: (s) => s.replace(/\[:\/\/\]/g, "://"),
  },
  {
    id: "dots",
    label: "Restore [.] → .",
    test: /\[\.\]/,
    apply: (s) => s.replace(/\[\.\]/g, "."),
  },
  {
    id: "at",
    label: "Restore [@] → @",
    test: /\[@\]/,
    apply: (s) => s.replace(/\[@\]/g, "@"),
  },
];

export function UrlRefangTool() {
  const [input, setInput] = React.useState("");
  const [toggles, setToggles] = React.useState<Record<string, boolean>>({
    http: true,
    colon: true,
    dots: true,
    at: true,
  });
  const [copied, setCopied] = React.useState(false);

  const output = React.useMemo(() => {
    if (!input) return "";
    let result = input;
    for (const rule of RULES) {
      if (toggles[rule.id]) {
        result = rule.apply(result);
      }
    }
    return result;
  }, [input, toggles]);

  function toggle(id: string) {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* IN */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            IN
          </span>
          <span className="text-xs text-muted">{input.length} characters</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste defanged indicators to restore..."
          rows={14}
          className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent/60 focus:bg-card/80 focus:outline-none font-mono"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setInput("")}
          className="mt-3"
        >
          Clear
        </Button>
      </div>

      {/* OUT */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            OUT
          </span>
        </div>
        <div className="relative">
          <div
            className={cn(
              "min-h-[336px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm leading-relaxed text-foreground break-all font-mono",
              !output && "flex items-center justify-center text-muted/50"
            )}
          >
            {output || (
              <span className="text-center">Your refanged content will appear here</span>
            )}
          </div>
          {output && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="absolute right-3 top-3"
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>

        {/* Toggle Rules */}
        <div className="mt-4 space-y-2 rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Processing
          </p>
          {RULES.map((r) => {
            const isActive = toggles[r.id];
            const matches = r.test.test(input);
            return (
              <label
                key={r.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-secondary/60",
                  isActive ? "text-foreground" : "text-muted/50"
                )}
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => toggle(r.id)}
                  className={cn(
                    "relative inline-flex h-4 w-7 shrink-0 rounded-full border transition-colors",
                    isActive
                      ? "border-accent bg-accent"
                      : "border-border bg-secondary"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-3 translate-y-px rounded-full bg-white transition-transform",
                      isActive ? "translate-x-3.5" : "translate-x-0.5"
                    )}
                  />
                </button>
                <span className="flex-1">{r.label}</span>
                {matches && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                    match
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
