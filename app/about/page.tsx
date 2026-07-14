import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { CATEGORIES, TOOLS } from "@/lib/tools";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "About - CID — OSINT & Security Toolkit",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to toolkit
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Shield className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            About CID — OSINT & Security Toolkit
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            A professional multi-tool platform for cyber investigation.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted">
        <p>
          CID — OSINT & Security Toolkit is a modular, privacy-respecting collection
          of utilities designed for digital investigators, DFIR analysts, SOC
          analysts, penetration testers, OSINT researchers, and incident
          responders. The interface is modeled on the clean, serious aesthetic
          of government and enterprise intelligence platforms.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const count = TOOLS.filter((t) => t.category === c.id).length;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <p className="font-medium text-foreground">{c.label}</p>
                <p className="mt-1 text-xs">{count} tools</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Design Principles
          </h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Matte black, dark navy, slate and subtle blue accents.</li>
            <li>Client-side processing wherever possible — your data stays local.</li>
            <li>Strict TypeScript, reusable components, and a central tool registry.</li>
            <li>Adding a tool requires only a config entry and a component.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{TOOLS.length} Tools</Badge>
          <Badge variant="secondary">Dark Mode</Badge>
          <Badge variant="secondary">Responsive</Badge>
          <Badge variant="secondary">Accessible</Badge>
        </div>

        <p className="text-xs text-muted/70">
          For authorized security research and investigation use only. Always
          comply with applicable laws and regulations.
        </p>
      </div>
    </div>
  );
}
