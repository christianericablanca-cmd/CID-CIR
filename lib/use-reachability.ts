import * as React from "react";

const cache = new Map<string, "online" | "offline">();

async function checkUrl(url: string): Promise<"online" | "offline"> {
  const cached = cache.get(url);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });
    cache.set(url, "online");
    return "online";
  } catch {
    cache.set(url, "offline");
    return "offline";
  } finally {
    clearTimeout(timeout);
  }
}

export function useReachability(url: string | undefined) {
  const [status, setStatus] = React.useState<"loading" | "online" | "offline">(
    "loading"
  );

  React.useEffect(() => {
    if (!url) {
      setStatus("offline");
      return;
    }
    let cancelled = false;
    checkUrl(url).then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
}
