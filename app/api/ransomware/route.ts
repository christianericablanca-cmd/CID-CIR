import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.ransomware.live/v2";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const code = req.nextUrl.searchParams.get("code");
  const name = req.nextUrl.searchParams.get("name");

  let url: string;

  if (type === "country") {
    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Missing 'code' parameter." }, { status: 400 });
    }
    url = `${API_BASE}/countryvictims/${encodeURIComponent(code.trim())}`;
  } else if (type === "group") {
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Missing 'name' parameter." }, { status: 400 });
    }
    url = `${API_BASE}/group/${encodeURIComponent(name.trim())}`;
  } else {
    return NextResponse.json(
      { error: "Invalid type. Use 'country' or 'group'." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CID-Operations-Toolkit/1.0",
      },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json({ ok: res.ok, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
