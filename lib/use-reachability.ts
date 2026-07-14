import * as React from "react";

const cache = new Map<string, "online" | "offline" | "unknown">();

async function checkUrl(
  url: string
): Promise<"online" | "offline" | "unknown"> {
  try {
    const u = new URL(url);
    const pingUrl = `${u.protocol}//${u.hostname}/favicon.ico?${Date.now()}`;

    const imgResult = await new Promise<"online" | "offline">((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.src = "";
        resolve("offline");
      }, 8000);

      img.onload = () => {
        clearTimeout(timer);
        resolve("online");
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve("offline");
      };
      img.src = pingUrl;
    });

    if (imgResult === "online") {
      cache.set(url, "online");
      return "online";
    }

    // Favicon not found — try HEAD as fallback
    const fetchResult = await new Promise<"online" | "offline">((resolve) => {
      fetch(url, { method: "HEAD", mode: "no-cors" })
        .then(() => resolve("online"))
        .catch(() => resolve("offline"));
    });

    if (fetchResult === "online") {
      cache.set(url, "online");
      return "online";
    }

    // Both failed — could be down or just protected (Cloudflare, etc.)
    cache.set(url, "unknown");
    return "unknown";
  } catch {
    cache.set(url, "unknown");
    return "unknown";
  }
}

export function useReachability(url: string | undefined) {
  const [status, setStatus] = React.useState<
    "loading" | "online" | "offline" | "unknown"
  >("loading");
  const [refreshing, setRefreshing] = React.useState(false);

  const check = React.useCallback(async () => {
    if (!url) {
      setStatus("unknown");
      return;
    }
    const result = await checkUrl(url);
    setStatus(result);
  }, [url]);

  React.useEffect(() => {
    check();
  }, [check]);

  async function refresh() {
    if (!url) return;
    cache.delete(url);
    setRefreshing(true);
    await check();
    setRefreshing(false);
  }

  return { status, refresh, refreshing };
}
