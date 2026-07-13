import md5 from "js-md5";

const encoder = new TextEncoder();

export function md5Hex(input: string | ArrayBuffer): string {
  return md5(input);
}

export async function shaHex(
  algorithm: "SHA-1" | "SHA-256" | "SHA-512",
  input: string | ArrayBuffer
): Promise<string> {
  const data = typeof input === "string" ? encoder.encode(input) : input;
  const digest = await crypto.subtle.digest(algorithm, data);
  return bufferToHex(digest);
}

export async function hmacHex(
  algorithm: "SHA-256" | "SHA-512",
  key: string,
  message: string
): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return bufferToHex(sig);
}

export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBuffer(hex: string): ArrayBuffer {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

export function shannonEntropy(input: string): number {
  if (!input.length) return 0;
  const freq: Record<string, number> = {};
  for (const ch of input) freq[ch] = (freq[ch] || 0) + 1;
  let entropy = 0;
  const len = input.length;
  for (const ch in freq) {
    const p = freq[ch] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}
