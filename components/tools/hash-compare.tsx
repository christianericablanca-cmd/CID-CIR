"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HashCompareTool() {
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const match =
    a && b ? a.trim().toLowerCase() === b.trim().toLowerCase() : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Label className="mb-2 block">Hash A</Label>
          <Input
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="Paste first hash..."
            className="font-mono"
          />
        </div>
        <div>
          <Label className="mb-2 block">Hash B</Label>
          <Input
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="Paste second hash..."
            className="font-mono"
          />
        </div>
      </div>
      {match !== null && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/40 p-4">
          {match ? (
            <>
              <Badge variant="success">Match</Badge>
              <span className="text-sm text-muted">
                Both hashes are identical.
              </span>
            </>
          ) : (
            <>
              <Badge variant="danger">No Match</Badge>
              <span className="text-sm text-muted">
                The two hashes differ.
              </span>
            </>
          )}
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setA("");
          setB("");
        }}
      >
        Clear
      </Button>
    </div>
  );
}
