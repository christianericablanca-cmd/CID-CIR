import {
  Activity,
  Binary,
  Boxes,
  Braces,
  Code2,
  Fingerprint,
  Globe,
  Link2,
  Lock,
  Mail,
  MessageCircle,
  Network,
  ScanLine,
  Search,
  Shield,
  ShieldCheck,
  Siren,
  Terminal,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Category definitions. Order here defines display order on the homepage.
 */
export type CategoryId =
  | "encoding"
  | "hash"
  | "domain"
  | "website"
  | "threat"
  | "osint"
  | "monitoring";

export interface CategoryDef {
  id: CategoryId;
  label: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "encoding", label: "Encoding & Decoding" },
  { id: "hash", label: "Hash & Crypto" },
  { id: "domain", label: "Domain & DNS" },
  { id: "website", label: "Website Analysis" },
  { id: "threat", label: "Threat Intelligence" },
  { id: "osint", label: "OSINT" },
  { id: "monitoring", label: "Monitoring" },
];

export type ToolType = "builtin" | "external";
export type ToolScope = "Built-in" | "External";

export interface ToolDef {
  /** Unique slug used for routing built-in tools. */
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  type: ToolType;
  /** Route for built-in tools (e.g. /tools/base64). */
  route?: string;
  /** External URL for external tools. */
  url?: string;
  icon: LucideIcon;
  /** Human readable scope label shown on cards. */
  scope: ToolScope;
}

const builtin = (slug: string): string => `/tools/${slug}`;

export const TOOLS: ToolDef[] = [
  // ── Encoding & Decoding ──────────────────────────────────────────────
  {
    slug: "url-defang",
    name: "URL Defanger",
    description:
      "Safely defang URLs, IPs, and domains by replacing characters to prevent accidental clicks.",
    category: "encoding",
    type: "builtin",
    route: builtin("url-defang"),
    icon: Link2,
    scope: "Built-in",
  },
  {
    slug: "url-refang",
    name: "URL Refanger",
    description:
      "Restore defanged indicators back to their original clickable form for analysis.",
    category: "encoding",
    type: "builtin",
    route: builtin("url-refang"),
    icon: Link2,
    scope: "Built-in",
  },
  {
    slug: "base64",
    name: "Base64 Encode / Decode",
    description:
      "Quickly encode or decode text using the Base64 algorithm.",
    category: "encoding",
    type: "builtin",
    route: builtin("base64"),
    icon: Binary,
    scope: "Built-in",
  },
  {
    slug: "url-encode",
    name: "URL Encode / Decode",
    description:
      "Percent-encode or decode strings for safe use in URLs and query parameters.",
    category: "encoding",
    type: "builtin",
    route: builtin("url-encode"),
    icon: Code2,
    scope: "Built-in",
  },
  {
    slug: "jwt",
    name: "JWT Decoder",
    description:
      "Decode and inspect the header, payload, and signature of JSON Web Tokens.",
    category: "encoding",
    type: "builtin",
    route: builtin("jwt"),
    icon: Fingerprint,
    scope: "Built-in",
  },
  {
    slug: "json",
    name: "JSON Formatter",
    description:
      "Beautify, validate, and minify JSON data with instant feedback.",
    category: "encoding",
    type: "builtin",
    route: builtin("json"),
    icon: Braces,
    scope: "Built-in",
  },
  {
    slug: "xml",
    name: "XML Formatter",
    description:
      "Pretty-print and validate XML documents for clean, readable structure.",
    category: "encoding",
    type: "builtin",
    route: builtin("xml"),
    icon: Braces,
    scope: "Built-in",
  },

  // ── Hash & Crypto ────────────────────────────────────────────────────
  {
    slug: "hash",
    name: "Hash Generator",
    description:
      "Generate MD5, SHA1, SHA256, and SHA512 hashes of any input text.",
    category: "hash",
    type: "builtin",
    route: builtin("hash"),
    icon: Lock,
    scope: "Built-in",
  },
  {
    slug: "file-hash",
    name: "File Hash Calculator",
    description:
      "Compute MD5, SHA1, SHA256, and SHA512 checksums of uploaded files.",
    category: "hash",
    type: "builtin",
    route: builtin("file-hash"),
    icon: Boxes,
    scope: "Built-in",
  },
  {
    slug: "hash-compare",
    name: "Hash Comparator",
    description:
      "Compare a generated hash against a known value with constant-time checks.",
    category: "hash",
    type: "builtin",
    route: builtin("hash-compare"),
    icon: ScanLine,
    scope: "Built-in",
  },
  {
    slug: "password-strength",
    name: "Password Strength Checker",
    description:
      "Evaluate password entropy and strength against modern best practices.",
    category: "hash",
    type: "builtin",
    route: builtin("password-strength"),
    icon: ShieldCheck,
    scope: "Built-in",
  },

  // ── Domain & DNS ─────────────────────────────────────────────────────
  {
    slug: "whois",
    name: "WHOIS Lookup",
    description:
      "Retrieve registration, ownership, and registrar details for a domain.",
    category: "domain",
    type: "external",
    url: "https://who.is/",
    icon: Globe,
    scope: "External",
  },
  {
    slug: "dns-records",
    name: "DNS Records Lookup",
    description:
      "Query A, AAAA, MX, TXT, NS, and CNAME records for any domain.",
    category: "domain",
    type: "external",
    url: "https://who.is/dns",
    icon: Network,
    scope: "External",
  },
  {
    slug: "asn-lookup",
    name: "ASN Lookup",
    description:
      "Identify the autonomous system, network owner, and routing details for an IP or AS number.",
    category: "domain",
    type: "external",
    url: "https://dnschecker.org/asn-whois-lookup.php",
    icon: Network,
    scope: "External",
  },
  {
    slug: "reverse-ip",
    name: "Reverse IP Lookup",
    description:
      "Find other domains and hosts sharing the same IP address.",
    category: "domain",
    type: "external",
    url: "https://dnschecker.org/reverse-dns.php",
    icon: Globe,
    scope: "External",
  },

  // ── Website Analysis ─────────────────────────────────────────────────
  {
    slug: "http-headers",
    name: "HTTP Headers Viewer",
    description:
      "Fetch and inspect the response headers returned by any web server.",
    category: "website",
    type: "builtin",
    route: builtin("http-headers"),
    icon: Webhook,
    scope: "Built-in",
  },


  // ── Threat Intelligence ──────────────────────────────────────────────


  // ── OSINT ────────────────────────────────────────────────────────────
  {
    slug: "google-dork",
    name: "Google Dork Generator",
    description:
      "Compose powerful Google dork search queries using advanced operators.",
    category: "osint",
    type: "builtin",
    route: builtin("google-dork"),
    icon: Search,
    scope: "Built-in",
  },

  // ── External Tools ───────────────────────────────────────────────────
  {
    slug: "mxtoolbox",
    name: "MXToolbox",
    description:
      "Comprehensive SMTP, DNS, and blacklist diagnostics for mail and network infrastructure.",
    category: "domain",
    type: "external",
    url: "https://mxtoolbox.com/",
    icon: Mail,
    scope: "External",
  },
  {
    slug: "dnsviz",
    name: "DNSViz",
    description:
      "Visualize and analyze the DNSSEC deployment and resolution path of a domain.",
    category: "domain",
    type: "external",
    url: "https://dnsviz.net/",
    icon: Network,
    scope: "External",
  },
  {
    slug: "crtsh",
    name: "crt.sh",
    description:
      "Search Certificate Transparency logs for certificates issued to a domain.",
    category: "domain",
    type: "external",
    url: "https://crt.sh/",
    icon: Globe,
    scope: "External",
  },
  {
    slug: "subdomain-finder",
    name: "Subdomain Finder",
    description:
      "Discover subdomains of any domain using an extensive passive reconnaissance database.",
    category: "domain",
    type: "external",
    url: "https://subdomainfinder.c99.nl/",
    icon: Search,
    scope: "External",
  },
  {
    slug: "isitdown",
    name: "Is It Down Right Now",
    description:
      "Check if a website is currently down or accessible worldwide.",
    category: "domain",
    type: "external",
    url: "https://www.isitdownrightnow.com/",
    icon: Activity,
    scope: "External",
  },
  {
    slug: "down-checker",
    name: "Down Checker",
    description:
      "Check if a website is reachable from our servers — shows HTTP status and response time.",
    category: "domain",
    type: "builtin",
    route: builtin("down-checker"),
    icon: Activity,
    scope: "Built-in",
  },
  {
    slug: "port-scanner",
    name: "Port Scanner",
    description:
      "Scan common ports on a target host to check which services are exposed and reachable.",
    category: "domain",
    type: "builtin",
    route: builtin("port-scanner"),
    icon: Network,
    scope: "Built-in",
  },
  {
    slug: "securityheaders-com",
    name: "SecurityHeaders.com",
    description:
      "Grade the security headers of any website with a detailed report.",
    category: "website",
    type: "external",
    url: "https://securityheaders.com/",
    icon: Shield,
    scope: "External",
  },
  {
    slug: "observatory",
    name: "Mozilla Observatory",
    description:
      "Test and improve the security of web applications with Mozilla's scanner.",
    category: "website",
    type: "external",
    url: "https://observatory.mozilla.org/",
    icon: ShieldCheck,
    scope: "External",
  },
  {
    slug: "ssllabs",
    name: "SSL Labs",
    description:
      "Deep analysis of the SSL/TLS configuration and certificate of a server.",
    category: "website",
    type: "external",
    url: "https://www.ssllabs.com/ssltest/",
    icon: Shield,
    scope: "External",
  },
  {
    slug: "builtwith",
    name: "BuiltWith",
    description:
      "Discover the technologies, frameworks, and services powering a website.",
    category: "website",
    type: "external",
    url: "https://builtwith.com/",
    icon: Code2,
    scope: "External",
  },
  {
    slug: "webcheck",
    name: "Web Check",
    description:
      "Comprehensive open-source intelligence tool for website analysis and enumeration.",
    category: "website",
    type: "external",
    url: "https://web-check.xyz/",
    icon: Search,
    scope: "External",
  },
  {
    slug: "shodan",
    name: "Shodan",
    description:
      "Search engine for internet-connected devices, services, and banners.",
    category: "threat",
    type: "external",
    url: "https://www.shodan.io/",
    icon: Search,
    scope: "External",
  },
  {
    slug: "virustotal",
    name: "VirusTotal",
    description:
      "Analyze files, URLs, IPs, and domains against dozens of antivirus engines.",
    category: "threat",
    type: "external",
    url: "https://www.virustotal.com/",
    icon: ScanLine,
    scope: "External",
  },
  {
    slug: "urlscan",
    name: "URLScan",
    description:
      "Submit and analyze URLs to capture screenshots, requests, and indicators.",
    category: "threat",
    type: "external",
    url: "https://urlscan.io/",
    icon: Webhook,
    scope: "External",
  },
  {
    slug: "abuseipdb",
    name: "AbuseIPDB",
    description:
      "Report and check IP addresses against a crowdsourced abuse database.",
    category: "threat",
    type: "external",
    url: "https://www.abuseipdb.com/",
    icon: Siren,
    scope: "External",
  },
  {
    slug: "greynoise",
    name: "GreyNoise",
    description:
      "Contextualize internet scan traffic and filter out benign noise.",
    category: "threat",
    type: "external",
    url: "https://greynoise.io/",
    icon: Activity,
    scope: "External",
  },
  {
    slug: "wayback",
    name: "Wayback Machine",
    description:
      "Browse historical snapshots and archived versions of any website.",
    category: "osint",
    type: "external",
    url: "https://web.archive.org/",
    icon: Globe,
    scope: "External",
  },
  {
    slug: "terminal",
    name: "Censys",
    description:
      "Search the census of internet devices, hosts, and certificates.",
    category: "osint",
    type: "external",
    url: "https://search.censys.io/",
    icon: Terminal,
    scope: "External",
  },

  // ── Monitoring ─────────────────────────────────────────────────────
  {
    slug: "ransomware-live",
    name: "Ransomware.live",
    description:
      "Query ransomware victim data by country or group using the Ransomware.live API.",
    category: "monitoring",
    type: "builtin",
    route: builtin("ransomware-live"),
    icon: Siren,
    scope: "Built-in",
  },

  // ── Monitoring: Forums ──────────────────────────────────────────────
  {
    slug: "darkforums",
    name: "Dark Forums",
    description: "Russian-language cybercrime forum with marketplaces, leaks, and hacking discussions.",
    category: "monitoring",
    type: "external",
    url: "https://darkforums.ru/",
    icon: MessageCircle,
    scope: "External",
  },
  {
    slug: "breached",
    name: "Breached",
    description: "Prominent data breach and cybercrime forum for leak publishing and discussions.",
    category: "monitoring",
    type: "external",
    url: "https://breached.st/",
    icon: MessageCircle,
    scope: "External",
  },
  {
    slug: "pwnforums",
    name: "PwnForums",
    description: "Cybersecurity and hacking forum focused on exploits, tutorials, and community research.",
    category: "monitoring",
    type: "external",
    url: "https://pwnforums.st/",
    icon: MessageCircle,
    scope: "External",
  },
  {
    slug: "femboyforum",
    name: "Femboy Forum",
    description: "Online community forum for discussion, culture, and social interaction.",
    category: "monitoring",
    type: "external",
    url: "https://femboyforum.com/",
    icon: MessageCircle,
    scope: "External",
  },
  {
    slug: "vecert-forums",
    name: "VeCert Forums",
    description: "Cybersecurity forum community for threat discussions, analysis, and intelligence sharing.",
    category: "monitoring",
    type: "external",
    url: "https://analyzer.vecert.io/forums",
    icon: MessageCircle,
    scope: "External",
  },
];

/** Group tools by category, preserving CATEGORIES order. */
export function getToolsByCategory(): { category: CategoryDef; tools: ToolDef[] }[] {
  return CATEGORIES.map((category) => ({
    category,
    tools: TOOLS.filter((t) => t.category === category.id),
  })).filter((group) => group.tools.length > 0);
}

export function getToolBySlug(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function filterTools(query: string): ToolDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.scope.toLowerCase().includes(q)
  );
}
