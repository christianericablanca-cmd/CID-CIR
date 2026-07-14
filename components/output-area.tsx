"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

export function OutputArea({
  label,
  value,
  placeholder = "Output will appear here...",
  onDownload,
  downloadName = "result.txt",
  className,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  onDownload?: () => void;
  downloadName?: string;
  className?: string;
}) {
  function handleDownload() {
    if (onDownload) {
      onDownload();
      return;
    }
    const blob = new Blob([value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        {label ? (
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {value && (
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="size-4" />
              Download
            </Button>
          )}
          <CopyButton value={value} label="Copy" />
        </div>
      </div>
      <textarea
        readOnly
        value={value}
        placeholder={placeholder}
        className={cn(
          "min-h-[120px] w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted/50 font-mono",
          !value && "text-muted/50"
        )}
      />
    </div>
  );
}
