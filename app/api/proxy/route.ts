import { NextRequest, NextResponse } from "next/server";

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withProto);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  const normalized = normalizeUrl(target || "");
  if (!normalized) {
    return NextResponse.json(
      { error: "Invalid or missing 'url' parameter." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(normalized, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "CID-Operations-Toolkit/1.0",
        Accept: "*/*",
      },
    });

    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return NextResponse.json({
      ok: true,
      status: res.status,
      statusText: res.statusText,
      finalUrl: res.url,
      headers,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
