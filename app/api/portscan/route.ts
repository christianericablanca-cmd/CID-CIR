import { NextRequest, NextResponse } from "next/server";
import * as net from "net";

const COMMON_PORTS: [number, string][] = [
  [21, "FTP"],
  [22, "SSH"],
  [23, "Telnet"],
  [25, "SMTP"],
  [53, "DNS"],
  [80, "HTTP"],
  [110, "POP3"],
  [143, "IMAP"],
  [443, "HTTPS"],
  [445, "SMB"],
  [993, "IMAPS"],
  [995, "POP3S"],
  [1433, "MSSQL"],
  [1521, "Oracle DB"],
  [2049, "NFS"],
  [3306, "MySQL"],
  [3389, "RDP"],
  [5432, "PostgreSQL"],
  [5900, "VNC"],
  [6379, "Redis"],
  [8080, "HTTP-Alt"],
  [8443, "HTTPS-Alt"],
  [9090, "HTTP-Alt2"],
  [27017, "MongoDB"],
];

async function checkPort(
  host: string,
  port: number,
  timeout = 3000
): Promise<"open" | "closed"> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on("connect", () => {
      socket.destroy();
      resolve("open");
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve("closed");
    });
    socket.on("error", () => {
      socket.destroy();
      resolve("closed");
    });
    socket.connect(port, host);
  });
}

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get("host");
  const custom = req.nextUrl.searchParams.get("ports");

  if (!host || !host.trim()) {
    return NextResponse.json({ error: "Missing 'host' parameter." }, { status: 400 });
  }

  const portsToScan: [number, string][] = [];

  if (custom) {
    for (const p of custom.split(",")) {
      const n = parseInt(p.trim(), 10);
      if (!isNaN(n) && n > 0 && n <= 65535) {
        const known = COMMON_PORTS.find(([k]) => k === n);
        portsToScan.push([n, known ? known[1] : `Port ${n}`]);
      }
    }
  }

  if (portsToScan.length === 0) {
    portsToScan.push(...COMMON_PORTS);
  }

  // Scan in batches of 10
  const results: { port: number; service: string; status: "open" | "closed" }[] = [];
  for (let i = 0; i < portsToScan.length; i += 10) {
    const batch = portsToScan.slice(i, i + 10);
    const scans = batch.map(([port, service]) =>
      checkPort(host.trim(), port, 3000).then((status) => ({ port, service, status }))
    );
    const batchResults = await Promise.all(scans);
    results.push(...batchResults);
  }

  return NextResponse.json({ host: host.trim(), results });
}
