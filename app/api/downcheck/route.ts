import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target || !target.trim()) {
    return NextResponse.json({ error: "Missing 'url' parameter." }, { status: 400 });
  }

  let url = target.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "CID-CIR-DownChecker/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    const elapsed = Date.now() - start;

    return NextResponse.json({
      ok: true,
      status: res.status,
      statusText: res.statusText,
      ms: elapsed,
      redirected: res.redirected,
      url: res.url,
      headers: Object.fromEntries(res.headers.entries()),
    });
  } catch (err) {
    const elapsed = Date.now() - start;
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({
      ok: false,
      error: message,
      ms: elapsed,
    });
  }
}
