# CID — Centralized Investigation Repository

**A modular, privacy-first cybersecurity multi-tool platform for digital investigators, DFIR analysts, SOC operators, OSINT researchers, and threat intelligence professionals.**

Built with Next.js 16, TypeScript, and TailwindCSS. All processing runs client-side — no data leaves your browser.

---

## Categories & Tools

### Encoding & Decoding
| Tool | Type |
|---|---|
| URL Defanger / Refanger | Built-in |
| Base64 Encode / Decode | Built-in |
| URL Encode / Decode | Built-in |
| JWT Decoder | Built-in |
| JSON / XML Formatter | Built-in |

### Hash & Crypto
| Tool | Type |
|---|---|
| Hash Generator (MD5, SHA-1, SHA-256/384/512) | Built-in |
| File Hash Calculator | Built-in |
| Hash Comparator | Built-in |
| Password Strength Analyzer | Built-in |

### Domain & DNS
| Tool | Type |
|---|---|
| WHOIS Lookup | External |
| DNS Records | External |
| ASN Lookup | External |
| Reverse IP | External |
| MXToolbox | External |
| DNSViz | External |
| crt.sh | External |
| Subdomain Finder | External |
| Is It Down Right Now | External |
| **Down Checker** | **Built-in** |
| **Port Scanner** | **Built-in** |

### Website Analysis
| Tool | Type |
|---|---|
| SecurityHeaders.com | External |
| Mozilla Observatory | External |
| SSL Labs | External |
| BuiltWith | External |
| Web Check | External |

### Threat Intelligence
| Tool | Type |
|---|---|
| Shodan | External |
| VirusTotal | External |
| URLScan.io | External |
| AbuseIPDB | External |
| GreyNoise | External |

### OSINT
| Tool | Type |
|---|---|
| Google Dork Generator | Built-in |
| Wayback Machine | External |
| Censys | External |

### Monitoring
| Tool | Type |
|---|---|
| **Ransomware.live** (API: country victims, group details, TTPs) | **Built-in** |
| Dark Forums | External |
| Breached | External |
| PwnForums | External |
| Femboy Forum | External |
| VeCert Forums | External |

---

## Features

- **Dual-sidebar layout** — tools organized by category on left and right panels
- **Live reachability indicators** — green/red/gray LEDs show external tool status; uncertain results offer manual retry
- **Ransomware.live integration** — query ransomware victims by country or group; displays locations, tools, and MITRE ATT&CK TTPs with expandable details
- **Port Scanner** — real TCP scan of 24 common ports from server; expand each result for service description, use cases, and attack vectors
- **Down Checker** — server-side HTTP check with status code, response time, and redirect tracking
- **Client-side processing** — all built-in tools run entirely in the browser; no data is sent to any server
- **Dark mode first** — with functional light/dark toggle
- **Mobile responsive** — collapsible drawer with full tool access on small screens
- **Keyboard search** — filter tools by name, description, or category
- **External tool cards** — each external link shows availability status and one-click open

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Animation | Framer Motion |
| Icons | Lucide React |
| Analytics | Vercel Web Analytics |
| Deployment | Vercel |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

### Deploy

Push to GitHub — Vercel auto-deploys on every commit to `main`.

---

## Security & Privacy

- No user accounts, no databases, no server-side storage
- No tracking cookies (except theme preference)
- Built-in tools process everything locally in the browser
- External tools open in new tabs — your activity is subject to their respective privacy policies
- All communications over HTTPS

---

## License

MIT — For authorized security research and investigation use only. Always comply with applicable laws and regulations.
