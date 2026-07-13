"use client";

import * as React from "react";
import { InputArea } from "@/components/input-area";
import { OutputArea } from "@/components/output-area";
import { Button } from "@/components/ui/button";

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function decodeBase64(str: string): string {
  const binary = atob(str.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function Base64Tool() {
  const [mode, setMode] = React.useState<"encode" | "decode">("encode");
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState("");

  const output = React.useMemo(() => {
    if (!input) return "";
    setError("");
    try {
      return mode === "encode" ? encodeBase64(input) : decodeBase64(input);
    } catch {
      setError(mode === "decode" ? "Invalid Base64 input." : "Encoding failed.");
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
          placeholder={mode === "encode" ? "Text to encode..." : "Base64 to decode..."}
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
