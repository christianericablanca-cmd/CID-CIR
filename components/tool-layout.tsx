import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ToolLayout({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to toolkit
      </Link>

      <div className="mb-8 flex items-start gap-4">
        {Icon && (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon className="size-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}
