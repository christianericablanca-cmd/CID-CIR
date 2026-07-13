"use client";

import * as React from "react";
import { InputArea } from "@/components/input-area";
import { OutputArea } from "@/components/output-area";
import { Button } from "@/components/ui/button";

export function UrlEncodeTool() {
  const [mode, setMode] = React.useState<"encode" | "decode">("encode");
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState("");

  const output = React.useMemo(() => {
    if (!input) return "";
    setError("");
    try {
      return mode === "encode"
        ? encodeURIComponent(input)
        : decodeURIComponent(input);
    } catch {
      setError("Invalid input for decoding.");
      return "";
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["encode", "decode"] as const).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={mode === m ? "default" : "secondary"}
            onClick={() => {
              setMode(m);
              setInput("");
            }}
          >
            {m === "encode" ? "Encode" : "Decode"}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <InputArea
          label="Input"
          value={input}
          onChange={setInput}
          placeholder={mode === "encode" ? "String to encode..." : "Encoded string..."}
          rows={10}
        />
        <OutputArea label="Output" value={error ? "" : output} downloadName="result.txt" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button variant="secondary" size="sm" onClick={() => setInput("")}>
        Clear
      </Button>
    </div>
  );
}
