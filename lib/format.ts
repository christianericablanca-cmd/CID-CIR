// Defang / refang indicators of compromise to prevent accidental clicks.

export function defang(text: string): string {
  return text
    .replace(/https?/gi, (m) => m.replace("t", "x").replace("T", "X"))
    .replace(/\./g, "[.]")
    .replace(/@/g, "[at]");
}

export function refang(text: string): string {
  return text
    .replace(/\[\.\]/g, ".")
    .replace(/\[:\]/g, ":")
    .replace(/\[at\]/gi, "@")
    .replace(/hxxp/gi, (m) => (m === "hxxp" ? "http" : "HTTP"))
    .replace(/hxxps/gi, (m) => (m === "hxxps" ? "https" : "HTTPS"));
}

export function formatJson(input: string, minify = false): string {
  const parsed = JSON.parse(input);
  return minify
    ? JSON.stringify(parsed)
    : JSON.stringify(parsed, null, 2);
}

// Lightweight, dependency-free XML pretty printer.
export function formatXml(input: string): string {
  const xml = input.replace(/>\s*</g, "><").trim();
  let formatted = "";
  let indent = 0;
  const pad = () => "  ".repeat(indent);
  xml.split(/(?=<)/).forEach((node) => {
    if (!node) return;
    if (node.startsWith("</")) {
      indent = Math.max(0, indent - 1);
      formatted += pad() + node + "\n";
    } else if (node.startsWith("<?") || node.startsWith("<!")) {
      formatted += pad() + node + "\n";
    } else if (/<[^>]+>.*<\/[^>]+>/.test(node)) {
      formatted += pad() + node + "\n";
    } else if (node.endsWith("/>")) {
      formatted += pad() + node + "\n";
    } else {
      formatted += pad() + node + "\n";
      indent += 1;
    }
  });
  return formatted.trim();
}
