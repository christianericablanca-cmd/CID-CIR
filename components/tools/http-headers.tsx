"use client";

import * as React from "react";
import { Webhook } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OutputArea } from "@/components/output-area";
import { Badge } from "@/components/ui/badge";

export function HttpHeadersTool() {
  const [url, setUrl] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function run() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setOutput("");
    setStatus("");
    try {
      const res = await fetch(
        `/api/proxy?url=${encodeURIComponent(url.trim())}`
      );
      const data = await res.json();
      if (!data.ok) setError(data.error || "Request failed.");
      else {
        setStatus(`${data.status} ${data.statusText || ""}`);
        setOutput(
          Object.entries(data.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label className="mb-2 block">URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
        </div>
        <Button onClick={run} disabled={loading || !url.trim()}>
          <Webhook className="size-4" />
          {loading ? "Fetching..." : "Fetch"}
        </Button>
      </div>
      {status && (
        <div className="flex items-center gap-2">
          <Badge variant="success">Status {status}</Badge>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2">
          <Badge variant="danger">Error</Badge>
          <span className="text-sm text-danger">{error}</span>
        </div>
      )}
      <OutputArea label="Response Headers" value={output} downloadName="headers.txt" />
    </div>
  );
}
