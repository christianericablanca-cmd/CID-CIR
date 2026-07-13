# CID Centralized Investigation Repository (CID-CIR)

A modular, dark-mode-first cybersecurity multi-tool platform for investigators, DFIR analysts, OSINT researchers, and threat intelligence professionals.

## Categories

### Encoding & Decoding
URL Defanger, URL Refanger, Base64, URL Encode, JWT Decoder, JSON Formatter, XML Formatter

### Hash & Crypto
Hash Generator, File Hash, Hash Comparator, Password Strength

### Domain & DNS
WHOIS, DNS Records, ASN Lookup, Reverse IP, MXToolbox, DNSViz, crt.sh, Subdomain Finder

### Website Analysis
SecurityHeaders.com, Mozilla Observatory, SSL Labs, BuiltWith, Web Check

### Threat Intelligence
Shodan, VirusTotal, URLScan, AbuseIPDB, GreyNoise, Wayback Machine, Censys

### OSINT
Google Dork Generator

### Monitoring
Ransomware.live (API integration), Dark Forums, Breached, PwnForums, Femboy Forum

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Deployment:** Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

All built-in tools run entirely client-side — no data leaves your browser.

## Usage

### Built-in Tools
Select any tool from the left or right sidebar. Results appear in the center workspace. All processing is local.

### External Tools
Click an external tool card to open the service in a new tab. These are third-party sites linked for convenience.

### Ransomware.live API
1. Click the **Ransomware.live** tool under Monitoring
2. Choose **By Country** (e.g. `PH` for Philippines) or **By Group** (e.g. `LockBit`, `Qilin`)
3. Click **Query** — results render as a table or structured report
4. Group details include locations, tools, and MITRE ATT&CK TTPs with expandable sections

### Search
Use the search bar in the top navbar or the sidebar filter to quickly find any tool by name, description, or category.

### Theme
Toggle dark/light mode using the sun/moon icon in the top-right corner.

## Deployment

Push to GitHub → Vercel auto-deploys on every commit to `main`.

## License

MIT — For authorized security research and investigation use only.
