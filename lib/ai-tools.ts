import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ── Allowed paths ─────────────────────────────────────────────────────
const HOME = process.env.USERPROFILE || process.env.HOME || "";
const PROJECT = path.resolve(".");
const TEMP = process.env.TEMP || "";

const ALLOWED_PATHS = [HOME, PROJECT, TEMP].filter(Boolean);

const BLOCKED_DIRS = [
  "node_modules", ".git", ".next", ".cache",
  "AppData/Local/Microsoft/Windows",
  "Windows", "Program Files", "Program Files (x86)",
  "System32", "SysWOW64",
];

const BLOCKED_FILES = [
  ".env", ".env.local", ".env.production",
  "id_rsa", "id_ed25519", ".ssh/config",
  "NTDS.dit", "SAM", "SYSTEM", "SECURITY",
];

// ── Helpers ───────────────────────────────────────────────────────────
function resolvePath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (trimmed.startsWith("~")) {
    const sub = trimmed.replace(/^~[\\/]?/, "");
    return path.resolve(HOME, sub);
  }
  return path.resolve(PROJECT, trimmed);
}

function isAllowedPath(resolved: string): boolean {
  const normalized = path.normalize(resolved).toLowerCase();
  const inAllowed = ALLOWED_PATHS.some((p) =>
    p ? normalized.startsWith(p.toLowerCase()) : false
  );
  if (!inAllowed) return false;
  const blocked = BLOCKED_DIRS.some((d) =>
    normalized.includes(d.toLowerCase().replace(/\//g, path.sep))
  );
  if (blocked) return false;
  const fname = path.basename(normalized);
  if (BLOCKED_FILES.some((b) => fname === b.toLowerCase())) return false;
  return true;
}

function isTextExtension(ext: string): boolean {
  const textExts = new Set([
    "txt", "md", "csv", "tsv", "json", "xml", "yml", "yaml", "toml",
    "log", "cfg", "conf", "ini", "env", "cnf",
    "py", "js", "ts", "jsx", "tsx", "html", "htm", "css", "scss", "less",
    "sh", "bash", "zsh", "ps1", "bat", "cmd",
    "rb", "go", "rs", "java", "kt", "scala",
    "php", "pl", "pm", "lua", "r", "m",
    "sql", "gradle", "sbt", "makefile", "dockerfile",
    "gitignore", "editorconfig",
    "c", "cpp", "h", "hpp", "cs", "swift",
    "vue", "svelte", "astro", "tex", "bib",
  ]);
  return textExts.has(ext);
}

// ── Tool definitions ──────────────────────────────────────────────────
export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description:
        "Read the content of a file on the local filesystem. " +
        "Supports text files and .docx documents. Sandboxed to safe directories.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute or relative path to the file." },
        },
        required: ["path"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_directory",
      description: "List files and directories at a given path (up to 3 levels deep).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute or relative path to the directory." },
          max_depth: { type: "integer", description: "How deep to recurse (0-3).", default: 1 },
        },
        required: ["path"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_fetch",
      description: "Fetch a URL and return its text content.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The full URL to fetch (http:// or https://)." },
          format: { type: "string", enum: ["text", "markdown"], description: "How to return the content.", default: "text" },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for a query and return relevant results.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query." },
          max_results: { type: "integer", description: "Maximum results (default 5, max 10).", default: 5 },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Write or overwrite a file on the local filesystem.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute or relative path." },
          content: { type: "string", description: "The full text content." },
        },
        required: ["path", "content"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_file",
      description: "Delete a file permanently.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file to delete." },
        },
        required: ["path"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "copy_file",
      description: "Copy a file or directory.",
      parameters: {
        type: "object",
        properties: {
          source: { type: "string", description: "Source path." },
          destination: { type: "string", description: "Destination path." },
        },
        required: ["source", "destination"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "run_command",
      description:
        "Execute a shell command. Use for Python scripts, CLI tools, git, file processing. " +
        "Timeout: 60 seconds. Working directory: project root.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to execute." },
          workdir: { type: "string", description: "Working directory." },
          timeout: { type: "integer", description: "Max seconds (default 30, max 120).", default: 30 },
        },
        required: ["command"],
        additionalProperties: false,
      },
    },
  },
];

// ── Exported web search for auto-search ───────────────────────────────

const ZENMUX_URL = "https://zenmux.ai/api/v1/chat/completions";

export async function webSearch(query: string, maxResults: number): Promise<string | null> {
  const allParts: string[] = [];

  // Run reliable public APIs in parallel — no API keys needed
  await Promise.all([
    searchORCID(query, maxResults).then(r => {
      if (r) allParts.push(`--- ORCID Academic Profile ---\n${r}`);
    }),
    searchWikipedia(query, maxResults).then(r => {
      if (r) allParts.push(`--- Wikipedia ---\n${r}`);
    }),
    searchGitHub(query, maxResults).then(r => {
      if (r) allParts.push(`--- GitHub ---\n${r}`);
    }),
  ]);

  if (allParts.length > 0) {
    return `Search results for "${query}":\n\n${allParts.join("\n\n")}`;
  }

  // Fallback: ZenMux model knowledge
  return zenmuxKnowledgeSearch(query, maxResults);
}

async function fetchWithTimeout(url: string, opts: Record<string, any>, ms: number): Promise<Response> {
  return Promise.race([
    fetch(url, { ...opts, headers: { ...opts.headers, Connection: "close" } }),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]) as Promise<Response>;
}

// ── ORCID public API (no auth needed for basic search) ──────────────

async function searchORCID(query: string, maxResults: number): Promise<string | null> {
  try {
    const searchRes = await fetchWithTimeout(
      `https://pub.orcid.org/v3.0/search?q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json", "User-Agent": "CID-OSINT/1.0" } },
      4000
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json() as any;
    const records = searchData?.result || [];
    if (records.length === 0) return null;

    const lines: string[] = [];
    for (let i = 0; i < Math.min(records.length, maxResults); i++) {
      const orcidPath = records[i]?.["orcid-identifier"]?.path;
      if (!orcidPath) continue;

      // Fetch full record
      const recRes = await fetchWithTimeout(
        `https://pub.orcid.org/v3.0/${orcidPath}/record`,
        { headers: { Accept: "application/json", "User-Agent": "CID-OSINT/1.0" } },
        3000
      );
      if (!recRes.ok) continue;
      const rec = await recRes.json() as any;

      const name = rec?.person?.name;
      const bio = rec?.person?.biography?.content;
      const given = name?.["given-names"]?.value || "";
      const family = name?.["family-name"]?.value || "";

      lines.push(`${i + 1}. ${given} ${family}`);
      lines.push(`   ORCID: https://orcid.org/${orcidPath}`);
      if (bio) lines.push(`   Bio: ${bio}`);

      // Employment
      const emps = rec?.["activities-summary"]?.employments?.["affiliation-group"] || [];
      for (const eg of emps) {
        const sum = eg?.summaries?.[0]?.["employment-summary"];
        if (sum) {
          const org = sum?.organization?.name || "";
          const role = sum?.["role-title"] || "";
          const city = sum?.organization?.address?.city || "";
          const region = sum?.organization?.address?.region || "";
          if (org) lines.push(`   ${role ? role + " at " : ""}${org} (${city}, ${region})`);
        }
      }

      // Education
      const edus = rec?.["activities-summary"]?.educations?.["affiliation-group"] || [];
      for (const eg of edus) {
        const sum = eg?.summaries?.[0]?.["education-summary"];
        if (sum) {
          const deg = sum?.["role-title"] || "";
          const org = sum?.organization?.name || "";
          const start = sum?.["start-date"]?.year?.value || "";
          const end = sum?.["end-date"]?.year?.value || "";
          if (deg) lines.push(`   ${deg} — ${org} (${start}–${end})`);
        }
      }

      // Works
      const works = rec?.["activities-summary"]?.works?.group || [];
      for (let w = 0; w < Math.min(works.length, 3); w++) {
        const ws = works[w]?.["work-summary"]?.[0];
        if (ws) {
          const title = ws?.title?.title?.value || "";
          const doi = ws?.url?.value || ws?.["external-ids"]?.["external-id"]?.[0]?.["external-id-value"] || "";
          if (title) {
            lines.push(`   Publication: "${title}"`);
            if (doi) lines.push(`     ${doi}`);
          }
        }
      }
    }

    return lines.length > 0 ? lines.join("\n") : null;
  } catch {
    return null;
  }
}

// ── Wikipedia public API ────────────────────────────────────────────

async function searchWikipedia(query: string, maxResults: number): Promise<string | null> {
  try {
    const searchRes = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${maxResults}&format=json&redirects=resolve`,
      { headers: { "User-Agent": "CID-OSINT/1.0" } },
      3000
    );
    if (!searchRes.ok) return null;
    const data = await searchRes.json() as any;
    const titles = data?.[1] || [];
    const urls = data?.[3] || [];
    if (titles.length === 0) return null;

    const lines: string[] = [];
    for (let i = 0; i < titles.length; i++) {
      lines.push(`${i + 1}. ${titles[i]}`);
      if (urls[i]) lines.push(`   URL: ${urls[i]}`);

      // Fetch summary
      try {
        const sumRes = await fetchWithTimeout(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[i])}`,
          { headers: { "User-Agent": "CID-OSINT/1.0" } },
          2000
        );
        if (sumRes.ok) {
          const sum = await sumRes.json() as any;
          const extract = sum?.extract?.replace(/\n/g, " ").slice(0, 300) || "";
          if (extract) lines.push(`   ${extract}`);
        }
      } catch { /* skip summary */ }
    }
    return lines.join("\n");
  } catch {
    return null;
  }
}

// ── GitHub public API ───────────────────────────────────────────────

async function searchGitHub(query: string, maxResults: number): Promise<string | null> {
  try {
    const searchRes = await fetchWithTimeout(
      `https://api.github.com/search/users?q=${encodeURIComponent(query)}+in:name&per_page=${maxResults}`,
      { headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "CID-OSINT/1.0" } },
      4000
    );
    if (!searchRes.ok) return null;
    const data = await searchRes.json() as any;
    const users = data?.items || [];
    if (users.length === 0) return null;

    const lines: string[] = [];
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      lines.push(`${i + 1}. ${u.login} (${u.type})`);
      lines.push(`   URL: ${u.html_url}`);
      if (u.score) lines.push(`   Score: ${u.score}`);
    }
    return lines.join("\n");
  } catch {
    return null;
  }
}

// ── ZenMux knowledge fallback ───────────────────────────────────────

async function zenmuxKnowledgeSearch(query: string, maxResults: number): Promise<string | null> {
  const apiKey = process.env.ZENMUX_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetchWithTimeout(
      ZENMUX_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "stepfun/step-3.7-flash-free",
          messages: [
            {
              role: "system",
              content:
                "You are a search results generator. Given a query, return up to " +
                maxResults +
                " real, factual search results in this exact format. " +
                "Do NOT make up results. Only return results you are confident exist from your training data. " +
                "If you don't know any real results, return exactly: NO_RESULTS\n\n" +
                "Format:\n1. Title\n   URL: https://...\n   relevant snippet\n\n",
            },
            { role: "user", content: `Search the web for: ${query}` },
          ],
          stream: false,
        }),
      },
      5000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return text.includes("NO_RESULTS") ? null : `Search results for "${query}":\n\n${text}`;
  } catch {
    return null;
  }
}

// ── Tool execution ────────────────────────────────────────────────────

export type ToolCallResult = {
  tool_call_id: string;
  role: "tool";
  name: string;
  content: string;
};

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  try {
    switch (name) {
      case "read_file":
        return await execReadFile(args, toolCallId);
      case "list_directory":
        return await execListDirectory(args, toolCallId);
      case "web_fetch":
        return await execWebFetch(args, toolCallId);
      case "web_search":
        return await execWebSearch(args, toolCallId);
      case "write_file":
        return await execWriteFile(args, toolCallId);
      case "delete_file":
        return await execDeleteFile(args, toolCallId);
      case "copy_file":
        return await execCopyFile(args, toolCallId);
      case "run_command":
        return await execRunCommand(args, toolCallId);
      default:
        return { tool_call_id: toolCallId, role: "tool", name, content: `Unknown tool: "${name}".` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { tool_call_id: toolCallId, role: "tool", name, content: `Error executing ${name}: ${msg}` };
  }
}

// ── read_file ─────────────────────────────────────────────────────────

async function execReadFile(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  if (!rawPath) return errorResult(toolCallId, "read_file", "Path is required.");
  const resolved = resolvePath(rawPath);
  if (!isAllowedPath(resolved)) {
    return errorResult(toolCallId, "read_file", `Access denied: "${resolved}" is outside allowed directories.`);
  }
  if (!fs.existsSync(resolved)) {
    return errorResult(toolCallId, "read_file", `File not found: "${rawPath}".`);
  }
  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    return errorResult(toolCallId, "read_file", `"${rawPath}" is not a file.`);
  }

  const ext = path.extname(resolved).slice(1).toLowerCase();
  const MAX_SIZE = 10 * 1024 * 1024;
  if (stat.size > MAX_SIZE) {
    return errorResult(toolCallId, "read_file", `File too large (${(stat.size / 1024 / 1024).toFixed(1)} MB).`);
  }

  if (ext === "docx") {
    try {
      const { extractRawText } = await import("mammoth");
      const buffer = fs.readFileSync(resolved);
      const result = await extractRawText({ buffer });
      const text = result.value.trim() || "(empty document)";
      const truncated = text.length > 100000
        ? text.slice(0, 100000) + `\n\n[... truncated at 100,000 characters ...]`
        : text;
      return { tool_call_id: toolCallId, role: "tool", name: "read_file", content: `Content of "${rawPath}" (${(stat.size / 1024).toFixed(1)} KB, DOCX):\n\`\`\`\n${truncated}\n\`\`\`` };
    } catch (e) {
      return errorResult(toolCallId, "read_file", `Failed to parse DOCX: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!isTextExtension(ext) && ext !== "") {
    return errorResult(toolCallId, "read_file", `"${ext}" files are not supported. Only text files and .docx are supported.`);
  }

  const content = fs.readFileSync(resolved, "utf-8");
  const truncated = content.length > 100000
    ? content.slice(0, 100000) + `\n\n[... file truncated at 100,000 characters ...]`
    : content;
  return { tool_call_id: toolCallId, role: "tool", name: "read_file", content: `Content of "${rawPath}" (${(stat.size / 1024).toFixed(1)} KB):\n\`\`\`\n${truncated}\n\`\`\`` };
}

// ── list_directory ────────────────────────────────────────────────────

async function execListDirectory(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  if (!rawPath) return errorResult(toolCallId, "list_directory", "Path is required.");
  const resolved = resolvePath(rawPath);
  const maxDepth = Math.min(Math.max(Number(args.max_depth) || 1, 0), 3);
  if (!isAllowedPath(resolved)) {
    return errorResult(toolCallId, "list_directory", `Access denied: "${resolved}" is outside allowed directories.`);
  }
  if (!fs.existsSync(resolved)) {
    return errorResult(toolCallId, "list_directory", `Directory not found: "${rawPath}".`);
  }
  if (!fs.statSync(resolved).isDirectory()) {
    return errorResult(toolCallId, "list_directory", `"${rawPath}" is not a directory.`);
  }
  const entries = walkDir(resolved, rawPath, 0, maxDepth);
  return { tool_call_id: toolCallId, role: "tool", name: "list_directory", content: `Contents of "${rawPath}":\n\`\`\`\n${entries || "(empty directory)"}\n\`\`\`` };
}

function walkDir(dir: string, displayBase: string, depth: number, maxDepth: number): string {
  if (depth > maxDepth) return "";
  let result = "";
  const indent = "  ".repeat(depth);
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      if (entry.name.startsWith(".") && depth === 0) continue;
      const fullPath = path.join(dir, entry.name);
      const displayPath = path.join(displayBase, entry.name);
      const size = entry.isFile() ? ` (${formatFileSize(fs.statSync(fullPath).size)})` : "/";
      result += `${indent}${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${displayPath}${size}\n`;
      if (entry.isDirectory() && depth < maxDepth) {
        result += walkDir(fullPath, displayPath, depth + 1, maxDepth);
      }
    }
  } catch {
    result += `${indent}(error reading directory)\n`;
  }
  return result;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

// ── web_fetch ─────────────────────────────────────────────────────────

async function execWebFetch(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const url = String(args.url || "").trim();
  if (!url) return errorResult(toolCallId, "web_fetch", "URL is required.");
  let normalized: string;
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const u = new URL(withProto);
    if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid protocol");
    normalized = u.toString();
  } catch {
    return errorResult(toolCallId, "web_fetch", `Invalid URL: "${url}".`);
  }
  try {
    const res = await Promise.race([
      fetch(normalized, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Connection: "close",
        },
      }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
    ]) as Response;
    const text = await res.text();
    const clean = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const maxLen = 50000;
    const body = clean.length > maxLen
      ? clean.slice(0, maxLen) + `\n\n[... content truncated at ${maxLen} characters ...]`
      : clean;
    return { tool_call_id: toolCallId, role: "tool", name: "web_fetch", content: `Content from ${normalized} (HTTP ${res.status}):\n\n${body}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return errorResult(toolCallId, "web_fetch", `Failed to fetch "${normalized}": ${msg}`);
  }
}

// ── web_search ────────────────────────────────────────────────────────

async function execWebSearch(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const query = String(args.query || "").trim();
  if (!query) return errorResult(toolCallId, "web_search", "Query is required.");
  const maxResults = Math.min(Math.max(Number(args.max_results) || 5, 1), 10);
  const result = await webSearch(query, maxResults);
  if (result) {
    return { tool_call_id: toolCallId, role: "tool", name: "web_search", content: result };
  }
  return { tool_call_id: toolCallId, role: "tool", name: "web_search", content: `No search results found for "${query}".` };
}

// ── write_file ────────────────────────────────────────────────────────

async function execWriteFile(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  const content = String(args.content ?? "");
  if (!rawPath) return errorResult(toolCallId, "write_file", "Path is required.");
  const resolved = resolvePath(rawPath);
  if (!isAllowedPath(resolved)) {
    return errorResult(toolCallId, "write_file", `Access denied: "${resolved}" is outside allowed directories.`);
  }
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    return errorResult(toolCallId, "write_file", `Parent directory does not exist: "${dir}".`);
  }
  try {
    fs.writeFileSync(resolved, content, "utf-8");
    return { tool_call_id: toolCallId, role: "tool", name: "write_file", content: `Successfully wrote ${content.length} bytes to "${rawPath}".` };
  } catch (e) {
    return errorResult(toolCallId, "write_file", `Failed to write file: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── delete_file ───────────────────────────────────────────────────────

async function execDeleteFile(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  if (!rawPath) return errorResult(toolCallId, "delete_file", "Path is required.");
  const resolved = resolvePath(rawPath);
  if (!isAllowedPath(resolved)) {
    return errorResult(toolCallId, "delete_file", `Access denied: "${resolved}" is outside allowed directories.`);
  }
  if (!fs.existsSync(resolved)) {
    return errorResult(toolCallId, "delete_file", `File not found: "${rawPath}".`);
  }
  if (!fs.statSync(resolved).isFile()) {
    return errorResult(toolCallId, "delete_file", `"${rawPath}" is not a file.`);
  }
  try {
    fs.unlinkSync(resolved);
    return { tool_call_id: toolCallId, role: "tool", name: "delete_file", content: `Successfully deleted "${rawPath}".` };
  } catch (e) {
    return errorResult(toolCallId, "delete_file", `Failed to delete: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── copy_file ─────────────────────────────────────────────────────────

async function execCopyFile(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawSrc = String(args.source || "").trim();
  const rawDst = String(args.destination || "").trim();
  if (!rawSrc) return errorResult(toolCallId, "copy_file", "Source path is required.");
  if (!rawDst) return errorResult(toolCallId, "copy_file", "Destination path is required.");
  const src = resolvePath(rawSrc);
  const dst = resolvePath(rawDst);
  if (!isAllowedPath(src)) return errorResult(toolCallId, "copy_file", `Access denied: source "${src}".`);
  if (!isAllowedPath(dst)) return errorResult(toolCallId, "copy_file", `Access denied: destination "${dst}".`);
  if (!fs.existsSync(src)) return errorResult(toolCallId, "copy_file", `Source not found: "${rawSrc}".`);
  try {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dst, { recursive: true });
    } else {
      fs.cpSync(src, dst);
    }
    return { tool_call_id: toolCallId, role: "tool", name: "copy_file", content: `Successfully copied "${rawSrc}" → "${rawDst}".` };
  } catch (e) {
    return errorResult(toolCallId, "copy_file", `Failed to copy: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── run_command ───────────────────────────────────────────────────────

const BLOCKED_COMMAND_PATTERNS = [
  /^rm\s+-rf\s+\/|^rm\s+--recursive\s+\//i,
  /^format\s+|^fdisk\s+|^mkfs\s+/i,
  /^shutdown\s+|^reboot\s+|^poweroff\s+/i,
  /^del\s+\/f\s+\/s\s+[a-z]:\\/i,
  /^rd\s+\/s\s+\/q\s+[a-z]:\\/i,
  /^taskkill\s+/i,
  /^\s*rm\s+-rf\s+~\s*$/i,
  /:\s*rm\s+-rf\s+.*\/$/i,
];

function isCommandBlocked(cmd: string): string | null {
  for (const pattern of BLOCKED_COMMAND_PATTERNS) {
    if (pattern.test(cmd.trim())) {
      return `Command blocked for safety: matches pattern ${pattern}`;
    }
  }
  return null;
}

async function execRunCommand(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const command = String(args.command || "").trim();
  if (!command) return errorResult(toolCallId, "run_command", "Command is required.");
  const blocked = isCommandBlocked(command);
  if (blocked) return errorResult(toolCallId, "run_command", blocked);
  const workdirRaw = String(args.workdir || "").trim();
  const workdir = workdirRaw ? resolvePath(workdirRaw) : PROJECT;
  const timeoutSec = Math.min(Math.max(Number(args.timeout) || 30, 1), 120);
  const timeoutMs = timeoutSec * 1000;

  return new Promise<ToolCallResult>((resolve) => {
    try {
      const output = execSync(command, {
        cwd: workdir,
        timeout: timeoutMs,
        maxBuffer: 5 * 1024 * 1024,
        encoding: "utf-8",
        windowsHide: true,
      });
      const truncated = output.length > 50000
        ? output.slice(0, 50000) + `\n\n[... output truncated at 50,000 characters ...]`
        : output;
      resolve({
        tool_call_id: toolCallId,
        role: "tool",
        name: "run_command",
        content: truncated
          ? `Command: \`${command}\`\nExit code: 0\n\n\`\`\`\n${truncated}\n\`\`\``
          : `Command: \`${command}\`\nExit code: 0\n\n(no output)`,
      });
    } catch (e: any) {
      const stderr = e.stderr?.toString().trim() || "";
      const stdout = e.stdout?.toString().trim() || "";
      const message = e.message || String(e);
      const exitCode = e.status ?? -1;
      const combined = [stdout, stderr].filter(Boolean).join("\n") || message;
      const truncated = combined.length > 50000
        ? combined.slice(0, 50000) + `\n\n[... output truncated at 50,000 characters ...]`
        : combined;
      resolve({
        tool_call_id: toolCallId,
        role: "tool",
        name: "run_command",
        content: `Command: \`${command}\`\nExit code: ${exitCode}\n\n\`\`\`\n${truncated}\n\`\`\``,
      });
    }
  });
}

// ── Error helper ──────────────────────────────────────────────────────

function errorResult(toolCallId: string, name: string, message: string): ToolCallResult {
  return { tool_call_id: toolCallId, role: "tool", name, content: `Error: ${message}` };
}
