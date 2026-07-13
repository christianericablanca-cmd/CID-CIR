"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Check {
  label: string;
  passed: boolean;
}

function analyze(pw: string): { score: number; checks: Check[]; label: string } {
  const checks: Check[] = [
    { label: "At least 8 characters", passed: pw.length >= 8 },
    { label: "At least 12 characters", passed: pw.length >= 12 },
    { label: "Contains lowercase", passed: /[a-z]/.test(pw) },
    { label: "Contains uppercase", passed: /[A-Z]/.test(pw) },
    { label: "Contains digits", passed: /\d/.test(pw) },
    {
      label: "Contains symbols",
      passed: /[^A-Za-z0-9]/.test(pw),
    },
    {
      label: "No repeated sequences",
      passed: !/(.)\1\1/.test(pw),
    },
  ];
  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  const label =
    score >= 85 ? "Strong" : score >= 60 ? "Moderate" : "Weak";
  return { score, checks, label };
}

const colors: Record<string, string> = {
  Strong: "bg-success",
  Moderate: "bg-warning",
  Weak: "bg-danger",
};

export function PasswordStrengthTool() {
  const [pw, setPw] = React.useState("");
  const result = React.useMemo(() => analyze(pw), [pw]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Password</Label>
        <Input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Enter a password to evaluate..."
          type="text"
          className="font-mono"
        />
      </div>
      {pw && (
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-muted">Strength</span>
              <span className="font-medium">{result.label}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full transition-all", colors[result.label])}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>
          <ul className="space-y-1.5">
            {result.checks.map((c) => (
              <li
                key={c.label}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    c.passed ? "bg-success" : "bg-danger"
                  )}
                />
                <span className={c.passed ? "text-foreground" : "text-muted"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        type="button"
        onClick={() => setPw("")}
      >
        Clear
      </Button>
    </div>
  );
}
