"use client";

import * as React from "react";
import { formatJson } from "@/lib/format";
import { InputArea } from "@/components/input-area";
import { OutputArea } from "@/components/output-area";
import { Button } from "@/components/ui/button";

export function JsonTool() {
  const [mode, setMode] = React.useState<"pretty" | "minify">("pretty");
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState("");

  const output = React.useMemo(() => {
    if (!input.trim()) {
      setError("");
      return "";
    }
    try {
      const res = formatJson(input, mode === "minify");
      setError("");
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON.");
      return "";
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === "pretty" ? "default" : "secondary"}
          onClick={() => setMode("pretty")}
        >
          Beautify
        </Button>
        <Button
          size="sm"
          variant={mode === "minify" ? "default" : "secondary"}
          onClick={() => setMode("minify")}
        >
          Minify
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <InputArea
          label="Input"
          value={input}
          onChange={setInput}
          placeholder="Paste JSON to format..."
          rows={12}
        />
        <OutputArea label="Output" value={error ? "" : output} downloadName="result.json" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button variant="secondary" size="sm" onClick={() => setInput("")}>
        Clear
      </Button>
    </div>
  );
}
