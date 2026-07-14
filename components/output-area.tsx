"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";

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
        <span className="text-xs text-muted/60">{value.length} characters</span>
      </div>
      <Textarea readOnly value={value} placeholder={placeholder} className="resize-none" />
      {value && (
        <div className="mt-2 flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleDownload}>
            <Download className="size-4" />
            Download
          </Button>
          <CopyButton value={value} label="Copy" />
        </div>
      )}
    </div>
  );
}