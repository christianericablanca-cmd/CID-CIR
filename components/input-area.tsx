"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";

export function InputArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </span>
          <span className="text-xs text-muted/60">{value.length} characters</span>
        </div>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
      />
    </div>
  );
}
