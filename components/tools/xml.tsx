"use client";

import * as React from "react";
import { formatXml } from "@/lib/format";
import { InputArea } from "@/components/input-area";
import { OutputArea } from "@/components/output-area";
import { Button } from "@/components/ui/button";

export function XmlTool() {
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState("");

  const output = React.useMemo(() => {
    if (!input.trim()) {
      setError("");
      return "";
    }
    try {
      const res = formatXml(input);
      setError("");
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid XML.");
      return "";
    }
  }, [input]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <InputArea
          label="Input"
          value={input}
          onChange={setInput}
          placeholder="Paste XML to format..."
          rows={12}
        />
        <OutputArea label="Output" value={error ? "" : output} downloadName="result.xml" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button variant="secondary" size="sm" onClick={() => setInput("")}>
        Clear
      </Button>
    </div>
  );
}
