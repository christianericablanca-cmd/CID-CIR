import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getToolBySlug, TOOLS } from "@/lib/tools";
import { TOOL_REGISTRY } from "@/components/tools/registry";
import { ToolLayout } from "@/components/tool-layout";

export function generateStaticParams() {
  return TOOLS.filter((t) => t.type === "builtin").map((t) => ({
    slug: t.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const tool = getToolBySlug(params.slug);
  if (!tool) return { title: "Tool not found" };
  return {
    title: `${tool.name} - CID — OSINT & Security Toolkit`,
    description: tool.description,
  };
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  if (!tool || tool.type !== "builtin") notFound();

  const Component = TOOL_REGISTRY[tool.slug];
  if (!Component) notFound();

  return (
    <ToolLayout
      title={tool.name}
      description={tool.description}
      icon={tool.icon}
    >
      <Component />
    </ToolLayout>
  );
}
