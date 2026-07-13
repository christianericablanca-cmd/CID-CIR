import Link from "next/link";
import { Github, Shield } from "lucide-react";

const GITHUB_URL = "https://github.com";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row lg:px-8">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Shield className="size-4 text-accent" />
          <span>CID Centralized Investigation Repository</span>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted">
            v1.0.0
          </span>
        </div>

        <div className="flex items-center gap-5 text-sm text-muted">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <Link href="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
          <span className="text-xs">
            MIT License
          </span>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-3 text-center text-xs text-muted/70">
        Developed by ~./S33-3Y3-D33 &middot; For authorized security research and investigation use only. Always comply with applicable laws and regulations.
      </div>
    </footer>
  );
}
