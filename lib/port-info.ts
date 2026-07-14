export interface PortInfo {
  description: string;
  use: string;
  risk: "low" | "medium" | "high" | "critical";
  attack_vectors: string[];
}

export const PORT_INFO: Record<number, PortInfo> = {
  21: {
    description: "FTP (File Transfer Protocol) — unencrypted file transfer protocol.",
    use: "Uploading/downloading files to/from a server.",
    risk: "high",
    attack_vectors: [
      "Brute-force credentials (anonymous login enabled)",
      "FTP bounce attack (port scanning via FTP proxy)",
      "Plaintext credential sniffing (no encryption)",
      "Malicious file upload (webshell, malware)",
    ],
  },
  22: {
    description: "SSH (Secure Shell) — encrypted remote administration protocol.",
    use: "Secure command-line access, remote management, file transfers (SFTP/SCP).",
    risk: "medium",
    attack_vectors: [
      "Brute-force / credential stuffing attacks",
      "Weak key exchange algorithms (downgrade attacks)",
      "Exploiting unpatched SSH vulnerabilities (e.g., CVE-2024-6387 regreSSHion)",
      "SSH tunneling for lateral movement",
    ],
  },
  23: {
    description: "Telnet — unencrypted remote terminal protocol (legacy).",
    use: "Remote CLI access to network devices, legacy systems, IoT.",
    risk: "critical",
    attack_vectors: [
      "Plaintext credential sniffing (no encryption)",
      "Session hijacking / MITM attacks",
      "Default credentials on network equipment",
      "Unauthorized device access and reconfigure",
    ],
  },
  25: {
    description: "SMTP (Simple Mail Transfer Protocol) — email delivery.",
    use: "Sending outgoing emails, mail relay between servers.",
    risk: "high",
    attack_vectors: [
      "Open relay — spam/phishing email abuse",
      "Email spoofing (no SPF/DKIM/DMARC checks)",
      "Brute-force authentication",
      "SMTP user enumeration (VRFY/EXPN commands)",
    ],
  },
  53: {
    description: "DNS (Domain Name System) — resolves domain names to IP addresses.",
    use: "Domain resolution, zone transfers, caching.",
    risk: "medium",
    attack_vectors: [
      "DNS amplification DDoS (open resolver)",
      "DNS cache poisoning / spoofing",
      "Zone transfer information disclosure (AXFR)",
      "DNS tunneling (data exfiltration/C2)",
    ],
  },
  80: {
    description: "HTTP (Hypertext Transfer Protocol) — unencrypted web traffic.",
    use: "Web serving, API endpoints, redirects to HTTPS.",
    risk: "medium",
    attack_vectors: [
      "Traffic interception / session hijacking (no encryption)",
      "Web application attacks (XSS, SQLi, RFI/LFI)",
      "Directory brute-forcing / enumeration",
      "HTTP request smuggling",
    ],
  },
  110: {
    description: "POP3 (Post Office Protocol v3) — email retrieval (unencrypted).",
    use: "Downloading emails from a mail server to a local client.",
    risk: "high",
    attack_vectors: [
      "Plaintext credential sniffing",
      "Brute-force mailbox access",
      "Mail spoofing / mailbox enumeration",
    ],
  },
  143: {
    description: "IMAP (Internet Message Access Protocol) — email retrieval (unencrypted).",
    use: "Accessing and managing emails directly on the mail server.",
    risk: "high",
    attack_vectors: [
      "Plaintext credential sniffing",
      "Brute-force / credential stuffing",
      "Mailbox enumeration and data theft",
    ],
  },
  443: {
    description: "HTTPS (HTTP over TLS/SSL) — encrypted web traffic.",
    use: "Secure web serving, API endpoints, all encrypted web communication.",
    risk: "low",
    attack_vectors: [
      "Vulnerable TLS version / weak cipher support",
      "Expired or misconfigured SSL certificates",
      "Web application vulnerabilities (behind HTTPS)",
      "Heartbleed-style TLS attacks (legacy)",
    ],
  },
  445: {
    description: "SMB (Server Message Block) — Windows file and printer sharing.",
    use: "File sharing, printer sharing, Windows network communication.",
    risk: "critical",
    attack_vectors: [
      "EternalBlue / MS17-010 exploitation (WannaCry, NotPetya)",
      "SMB relay / NTLM relay attacks",
      "Brute-force Windows credentials",
      "Ransomware propagation via SMB shares",
    ],
  },
  993: {
    description: "IMAPS — IMAP over TLS/SSL (encrypted email access).",
    use: "Secure email retrieval and mailbox management.",
    risk: "low",
    attack_vectors: [
      "Brute-force credentials",
      "Weak TLS configuration",
      "Mailbox enumeration",
    ],
  },
  995: {
    description: "POP3S — POP3 over TLS/SSL (encrypted email retrieval).",
    use: "Secure email downloading to client.",
    risk: "low",
    attack_vectors: [
      "Brute-force credentials",
      "Weak TLS configuration",
    ],
  },
  1433: {
    description: "MSSQL (Microsoft SQL Server) — database server.",
    use: "Relational database hosting, application data storage.",
    risk: "high",
    attack_vectors: [
      "Brute-force SA password (default 'sa' account)",
      "SQL injection via exposed database",
      "Weak authentication method (mixed mode)",
      "Unpatched MSSQL RCE vulnerabilities",
    ],
  },
  1521: {
    description: "Oracle DB — Oracle database listener port.",
    use: "Oracle database connections and management.",
    risk: "high",
    attack_vectors: [
      "Default credentials (system/manager)",
      "TNS listener poisoning",
      "Unauthorized database access",
      "SQL injection via exposed listener",
    ],
  },
  2049: {
    description: "NFS (Network File System) — UNIX/Linux file sharing.",
    use: "Remote file system access between UNIX/Linux systems.",
    risk: "high",
    attack_vectors: [
      "No-root-squash — privilege escalation via mounted share",
      "Export list enumeration (showmount -e)",
      "Sensitive file access via misconfigured exports",
      "NFSv3 — no authentication built-in",
    ],
  },
  3306: {
    description: "MySQL/MariaDB — open-source relational database.",
    use: "Web application database, content management systems.",
    risk: "high",
    attack_vectors: [
      "Brute-force root password",
      "Default credentials on development/staging",
      "SQL injection via exposed database",
      "Unauthenticated access (misconfigured)",
    ],
  },
  3389: {
    description: "RDP (Remote Desktop Protocol) — Windows remote GUI access.",
    use: "Remote Windows desktop administration, remote work.",
    risk: "critical",
    attack_vectors: [
      "Brute-force / password spraying (most attacked port)",
      "BlueKeep / CVE-2019-0708 RCE (legacy Windows)",
      "RDP relay / MITM attacks",
      "Ransomware deployment via compromised RDP (most common vector)",
    ],
  },
  5432: {
    description: "PostgreSQL — advanced open-source relational database.",
    use: "Application data storage, analytics, geospatial data.",
    risk: "high",
    attack_vectors: [
      "Brute-force superuser (postgres) password",
      "Default trust authentication (misconfigured pg_hba.conf)",
      "SQL injection via exposed listener",
      "File read via superuser (pg_read_file)",
    ],
  },
  5900: {
    description: "VNC (Virtual Network Computing) — remote desktop (often unencrypted).",
    use: "Remote GUI access to desktops and servers.",
    risk: "high",
    attack_vectors: [
      "Brute-force VNC password",
      "Plaintext session sniffing (no encryption by default)",
      "Default VNC passwords on appliances",
    ],
  },
  6379: {
    description: "Redis — in-memory data structure store / cache.",
    use: "Caching, session storage, message brokering, queues.",
    risk: "critical",
    attack_vectors: [
      "No authentication by default (older versions)",
      "SSH key injection via authorized_keys (if running as root)",
      "Data exfiltration from in-memory cache",
      "Cron job injection via Redis CONFIG SET",
      "Used as C2 infrastructure in attacks",
    ],
  },
  8080: {
    description: "HTTP-Alt — common alternative HTTP port (proxies, dev servers).",
    use: "Web proxies, application servers (Tomcat, Jenkins), dev environments.",
    risk: "medium",
    attack_vectors: [
      "Open proxy — used for traffic anonymization",
      "Unsecured admin panels / dev consoles",
      "Web application vulnerabilities",
      "Directory traversal on proxy servers",
    ],
  },
  8443: {
    description: "HTTPS-Alt — alternative HTTPS port (Tomcat, web admin panels).",
    use: "Secure admin panels, management consoles, alternative web servers.",
    risk: "medium",
    attack_vectors: [
      "Exposed admin panels with default credentials",
      "Weak TLS configuration",
      "Vulnerable management software (Jenkins, Tomcat)",
    ],
  },
  9090: {
    description: "HTTP-Alt2 — commonly used by admin panels and monitoring tools.",
    use: "Web administration panels (Cockpit, Prometheus, various GUIs).",
    risk: "medium",
    attack_vectors: [
      "Exposed admin panels / dashboards",
      "Default credentials on monitoring tools",
      "API endpoints with no authentication",
    ],
  },
  27017: {
    description: "MongoDB — NoSQL document database.",
    use: "Application data storage, content management, IoT data.",
    risk: "critical",
    attack_vectors: [
      "No authentication by default (MongoDB < 3.0)",
      "Massive data breaches (MongoDB ransom attacks)",
      "Full database export without credentials",
      "Default port scanning for open databases",
    ],
  },
};
