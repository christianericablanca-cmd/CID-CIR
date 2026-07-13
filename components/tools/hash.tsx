"use client";

import * as React from "react";
import { md5Hex, shaHex } from "@/lib/crypto";
import { InputArea } from "@/components/input-area";
import { OutputArea } from "@/components/output-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ALGOS = ["MD5", "SHA1", "SHA256", "SHA512"] as const;
type Algo = (typeof ALGOS)[number];

export function HashTool() {
  const [input, setInput] = React.useState("");
  const [algo, setAlgo] = React.useState<Algo>("SHA256");
  const [output, setOutput] = React.useState("");

  async function generate() {
    if (!input) {
      setOutput("");
      return;
    }
    if (algo === "MD5") {
      setOutput(md5Hex(input));
    } else if (algo === "SHA1") {
      setOutput(await shaHex("SHA-1", input));
    } else if (algo === "SHA256") {
      setOutput(await shaHex("SHA-256", input));
    } else {
      setOutput(await shaHex("SHA-512", input));
    }
  }

  React.useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, algo]);

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Label className="mb-2 block">Algorithm</Label>
        <div className="flex flex-wrap gap-2">
          {ALGOS.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={algo === a ? "default" : "secondary"}
              onClick={() => setAlgo(a)}
            >
              {a}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <InputArea
          label="Input"
          value={input}
          onChange={setInput}
          placeholder="Enter text to hash..."
          rows={8}
        />
        <OutputArea label={`${algo} Hash`} value={output} downloadName={`${algo}.txt`} />
      </div>
      <Button variant="secondary" size="sm" onClick={() => setInput("")}>
        Clear
      </Button>
    </div>
  );
}
