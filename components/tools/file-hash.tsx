"use client";

import * as React from "react";
import { md5Hex, shaHex } from "@/lib/crypto";
import { OutputArea } from "@/components/output-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const ALGOS = ["MD5", "SHA1", "SHA256", "SHA512"] as const;

export function FileHashTool() {
  const [fileName, setFileName] = React.useState("");
  const [fileSize, setFileSize] = React.useState(0);
  const [results, setResults] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setFileName(file.name);
    setFileSize(file.size);
    const buffer = await file.arrayBuffer();
    const out: Record<string, string> = {};
    out["MD5"] = md5Hex(buffer);
    out["SHA1"] = await shaHex("SHA-1", buffer);
    out["SHA256"] = await shaHex("SHA-256", buffer);
    out["SHA512"] = await shaHex("SHA-512", buffer);
    setResults(out);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <Label className="block">Select a file</Label>
      <input
        type="file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="block w-full text-sm text-muted file:mr-4 file:rounded-md file:border file:border-border file:bg-secondary file:px-4 file:py-2 file:text-foreground hover:file:bg-secondary/70"
      />
      {fileName && (
        <p className="text-xs text-muted">
          {fileName} · {(fileSize / 1024).toFixed(2)} KB
          {busy && " · computing..."}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {ALGOS.map((a) => (
          <Card key={a} className="p-4">
            <p className="mb-2 text-xs font-medium text-muted">{a}</p>
            <OutputArea value={results[a] || ""} downloadName={`${a}.txt`} />
          </Card>
        ))}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setFileName("");
          setFileSize(0);
          setResults({});
        }}
      >
        Clear
      </Button>
    </div>
  );
}
