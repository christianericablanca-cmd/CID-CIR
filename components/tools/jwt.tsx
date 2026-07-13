"use client";

import * as React from "react";
import { InputArea } from "@/components/input-area";
import { OutputArea } from "@/components/output-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface JwtParts {
  header: string;
  payload: string;
  signature: string;
}

function decodeJwt(token: string): JwtParts | null {
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  const b64 = (s: string) =>
    s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const decode = (s: string) => {
    try {
      return JSON.stringify(JSON.parse(atob(b64(s))), null, 2);
    } catch {
      return atob(b64(s));
    }
  };
  return {
    header: decode(parts[0]),
    payload: decode(parts[1]),
    signature: parts[2] || "",
  };
}

export function JwtTool() {
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState("");
  const parsed = React.useMemo(() => {
    if (!input.trim()) {
      setError("");
      return null;
    }
    const r = decodeJwt(input);
    if (!r) {
      setError("Invalid JWT format. Expected header.payload.signature.");
      return null;
    }
    setError("");
    return r;
  }, [input]);

  return (
    <div className="space-y-4">
      <InputArea
        label="JWT"
        value={input}
        onChange={setInput}
        placeholder="Paste a JSON Web Token..."
        rows={4}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {parsed && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="success">Decoded</Badge>
            <span className="text-xs text-muted">
              3 parts · header · payload · signature
            </span>
          </div>
          <OutputArea label="Header" value={parsed.header} downloadName="jwt-header.json" />
          <OutputArea label="Payload" value={parsed.payload} downloadName="jwt-payload.json" />
          <OutputArea label="Signature" value={parsed.signature} downloadName="jwt-signature.txt" />
        </div>
      )}
      <Button variant="secondary" size="sm" onClick={() => setInput("")}>
        Clear
      </Button>
    </div>
  );
}
