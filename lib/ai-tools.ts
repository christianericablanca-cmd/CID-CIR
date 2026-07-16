import * as fs from "fs";
import * as path from "path";
import { execSync, execFileSync } from "child_process";
import * as mammoth from "mammoth";

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
  // Must be within at least one allowed path
  const inAllowed = ALLOWED_PATHS.some((p) =>
    p ? normalized.startsWith(p.toLowerCase()) : false
  );
  if (!inAllowed) return false;

  // Block known system/p敏感 directories
  const blocked = BLOCKED_DIRS.some((d) =>
    normalized.includes(d.toLowerCase().replace(/\//g, path.sep))
  );
  if (blocked) return false;

  // Block specific sensitive files
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

// ── Tool definitions (OpenAI function-calling schema) ────────────────

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description:
        "Read the content of a file on the local filesystem. " +
        "Supports text files (logs, code, configs, CSV, JSON, XML, etc.) " +
        "and .docx documents (text extracted via mammoth). " +
        "Cannot read PDF directly — use run_command with Python for PDFs. " +
        "Sandboxed to safe directories.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Absolute or relative path to the file. " +
              "Relative paths are resolved against the project directory.",
          },
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
      description:
        "List files and directories at a given path. " +
        "Useful for exploring the filesystem structure, finding files, " +
        "or understanding project organization.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Absolute or relative path to the directory. " +
              "Relative paths are resolved against the project directory.",
          },
          max_depth: {
            type: "integer",
            description: "How deep to recurse (0 = top-level only, max 3).",
            default: 1,
          },
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
      description:
        "Fetch a URL and return its text content. " +
        "Useful for retrieving web pages, API responses, " +
        "raw text, or any content accessible via HTTP/HTTPS.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full URL to fetch (must start with http:// or https://).",
          },
          format: {
            type: "string",
            enum: ["text", "markdown"],
            description:
              "How to return the content. 'text' returns raw text " +
              "(stripped of HTML tags). 'markdown' attempts to convert HTML to markdown.",
            default: "text",
          },
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
      description:
        "Search the web for a query and return relevant snippets. " +
        "Useful for finding current information, news, documentation, " +
        "or any online data.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query (same as you'd type into a search engine).",
          },
          max_results: {
            type: "integer",
            description: "Maximum number of search results to return (default 5, max 10).",
            default: 5,
          },
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
      description:
        "Write or overwrite a file on the local filesystem. " +
        "Useful for creating scripts, reports, config files, or saving analysis output. " +
        "The parent directory must already exist. Sandboxed to safe directories.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Absolute or relative path where the file will be written. " +
              "Relative paths are resolved against the project directory.",
          },
          content: {
            type: "string",
            description: "The full text content to write to the file.",
          },
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
      description:
        "Delete a file from the local filesystem. " +
        "Cannot delete directories (use run_command with rmdir/rm for that). " +
        "Use with caution — files are permanently removed. Sandboxed to safe directories.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute or relative path to the file to delete.",
          },
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
      description:
        "Copy a file or directory from source to destination. " +
        "Useful for backing up files, moving data between locations, " +
        "or duplicating evidence. Sandboxed to safe directories.",
      parameters: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description: "Absolute or relative path to the source file or directory.",
          },
          destination: {
            type: "string",
            description: "Absolute or relative path to the destination.",
          },
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
        "Execute a shell command on the local machine and return its output. " +
        "Useful for running Python scripts, command-line tools, git operations, " +
        "file processing, or any system command. " +
        "The command runs in a new shell process. " +
        "BLOCKED: commands that modify system state (rm -rf /, format, shutdown, etc.). " +
        "Timeout: 60 seconds. Working directory: project root.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description:
              "The shell command to execute. Use full paths for tools " +
              "outside PATH when possible.",
          },
          workdir: {
            type: "string",
            description:
              "Working directory for the command. " +
              "Defaults to the project root if not specified. " +
              "Use ~/Desktop or C:\\Users\\... to run elsewhere.",
          },
          timeout: {
            type: "integer",
            description: "Maximum execution time in seconds (default 30, max 120).",
            default: 30,
          },
        },
        required: ["command"],
        additionalProperties: false,
      },
    },
  },
];

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
        return {
          tool_call_id: toolCallId,
          role: "tool",
          name,
          content: `Unknown tool: "${name}".`,
        };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      tool_call_id: toolCallId,
      role: "tool",
      name,
      content: `Error executing ${name}: ${msg}`,
    };
  }
}

// ── read_file ─────────────────────────────────────────────────────────

async function execReadFile(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  if (!rawPath)
    return errorResult(toolCallId, "read_file", "Path is required.");

  const resolved = resolvePath(rawPath);

  if (!isAllowedPath(resolved)) {
    return errorResult(
      toolCallId,
      "read_file",
      `Access denied: "${resolved}" is outside allowed directories or is a blocked location.`
    );
  }

  if (!fs.existsSync(resolved)) {
    return errorResult(
      toolCallId,
      "read_file",
      `File not found: "${rawPath}".`
    );
  }

  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    return errorResult(toolCallId, "read_file", `"${rawPath}" is not a file.`);
  }

  const ext = path.extname(resolved).slice(1).toLowerCase();
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB for binary docs

  if (stat.size > MAX_SIZE) {
    return errorResult(
      toolCallId,
      "read_file",
      `File too large (${(stat.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`
    );
  }

  // ── DOCX support via mammoth ─────────────────────────────────────────
  if (ext === "docx") {
    try {
      const buffer = fs.readFileSync(resolved);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim() || "(empty document)";
      const truncated = text.length > 100000
        ? text.slice(0, 100000) + `\n\n[... document truncated at 100,000 characters ...]`
        : text;
      return {
        tool_call_id: toolCallId,
        role: "tool",
        name: "read_file",
        content: `Content of "${rawPath}" (${(stat.size / 1024).toFixed(1)} KB, DOCX):\n\`\`\`\n${truncated}\n\`\`\``,
      };
    } catch (e) {
      return errorResult(
        toolCallId,
        "read_file",
        `Failed to parse DOCX: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  // ── Text files ───────────────────────────────────────────────────────
  if (!isTextExtension(ext) && ext !== "") {
    return errorResult(
      toolCallId,
      "read_file",
      `"${ext}" files are not supported. Only text files and .docx are supported.`
    );
  }

  const content = fs.readFileSync(resolved, "utf-8");
  const truncated =
    content.length > 100000
      ? content.slice(0, 100000) +
        `\n\n[... file truncated at 100,000 characters ...]`
      : content;

  return {
    tool_call_id: toolCallId,
    role: "tool",
    name: "read_file",
    content: `Content of "${rawPath}" (${(stat.size / 1024).toFixed(1)} KB):\n\`\`\`\n${truncated}\n\`\`\``,
  };
}

// ── list_directory ────────────────────────────────────────────────────

async function execListDirectory(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  if (!rawPath)
    return errorResult(toolCallId, "list_directory", "Path is required.");

  const resolved = resolvePath(rawPath);
  const maxDepth = Math.min(Math.max(Number(args.max_depth) || 1, 0), 3);

  if (!isAllowedPath(resolved)) {
    return errorResult(
      toolCallId,
      "list_directory",
      `Access denied: "${resolved}" is outside allowed directories.`
    );
  }

  if (!fs.existsSync(resolved)) {
    return errorResult(
      toolCallId,
      "list_directory",
      `Directory not found: "${rawPath}".`
    );
  }

  if (!fs.statSync(resolved).isDirectory()) {
    return errorResult(
      toolCallId,
      "list_directory",
      `"${rawPath}" is not a directory.`
    );
  }

  const entries = walkDir(resolved, rawPath, 0, maxDepth);
  return {
    tool_call_id: toolCallId,
    role: "tool",
    name: "list_directory",
    content: `Contents of "${rawPath}":\n\`\`\`\n${entries || "(empty directory)"}\n\`\`\``,
  };
}

function walkDir(
  dir: string,
  displayBase: string,
  depth: number,
  maxDepth: number
): string {
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
      if (entry.name.startsWith(".") && depth === 0) continue; // skip hidden at top
      const fullPath = path.join(dir, entry.name);
      const displayPath = path.join(displayBase, entry.name);
      const size = entry.isFile()
        ? ` (${formatFileSize(fs.statSync(fullPath).size)})`
        : "/";
      result += `${indent}${entry.isDirectory() ? "📁" : "📄"} ${displayPath}${size}\n`;

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
  if (!url)
    return errorResult(toolCallId, "web_fetch", "URL is required.");

  let normalized: string;
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const u = new URL(withProto);
    if (!/^https?:$/.test(u.protocol))
      throw new Error("Invalid protocol");
    normalized = u.toString();
  } catch {
    return errorResult(
      toolCallId,
      "web_fetch",
      `Invalid URL: "${url}". Must be a valid http(s) URL.`
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(normalized, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const text = await res.text();
    // Strip HTML tags for a cleaner read
    const clean = text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const maxLen = 50000;
    const body = clean.length > maxLen
      ? clean.slice(0, maxLen) +
        `\n\n[... content truncated at ${maxLen} characters ...]`
      : clean;

    return {
      tool_call_id: toolCallId,
      role: "tool",
      name: "web_fetch",
      content: `Content from ${normalized} (HTTP ${res.status}):\n\n${body}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Request failed";
    return errorResult(
      toolCallId,
      "web_fetch",
      `Failed to fetch "${normalized}": ${msg}`
    );
  } finally {
    clearTimeout(timeout);
  }
}

const ZENMUX_URL = "https://zenmux.ai/api/v1/chat/completions";

export async function aiWebSearch(
  query: string,
  maxResults: number
): Promise<string | null> {
  // Try multiple search engines in parallel
  const searches = [
    raceTimeout(bingWebSearch(query, maxResults), 5000),
    raceTimeout(ddgWebSearch(query, maxResults), 6000),
    raceTimeout(zenmuxSearch(query, maxResults), 8000),
  ];
  const results = await Promise.allSettled(searches);

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) return r.value;
  }
  return null;
}

async function bingWebSearch(
  query: string,
  _maxResults: number
): Promise<string | null> {
  try {
    const res = (await raceTimeout(
      fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
      }),
      5000
    )) as Response;
    if (!res.ok) return null;
    const html = (await raceTimeout(res.text(), 5000)) as string;
    const results: string[] = [];
    const linkRegex = /<a[^>]+href="(https?:\/\/(?!.*bing.com)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRegex.exec(html)) !== null && results.length < _maxResults) {
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      if (title.length > 3) {
        results.push(`${results.length + 1}. ${title}\n   URL: ${m[1]}`);
      }
    }
    return results.length > 0 ? `Web search results for "${query}":\n\n${results.join("\n\n")}` : null;
  } catch {
    return null;
  }
}

async function zenmuxSearch(
  query: string,
  maxResults: number
): Promise<string | null> {
  const apiKey = process.env.ZENMUX_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await raceTimeout(
      fetch(ZENMUX_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "stepfun/step-3.7-flash-free",
          messages: [
            {
              role: "system",
              content:
                "You are a web search tool. Return up to " +
                maxResults +
                " real, factual search results in this exact format:\n" +
                "1. Title\n   URL: https://...\n   relevant snippet\n\n" +
                "If you don't know any real results, return exactly: NO_RESULTS",
            },
            { role: "user", content: `Search the web for: ${query}` },
          ],
          stream: false,
        }),
      }),
      8000
    ) as Response;
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return text.includes("NO_RESULTS") ? null : `Search results for "${query}":\n\n${text}`;
  } catch {
    return null;
  }
}

function raceTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("race timeout")), ms)),
  ]);
}

async function ddgWebSearch(
  query: string,
  _maxResults: number
): Promise<string | null> {
  // Race the fetch against a timeout (AbortController unreliable during connection)
  const timeoutMs = 5000;
  try {
    const res = (await Promise.race([
      fetch("https://lite.duckduckgo.com/lite/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: `q=${encodeURIComponent(query)}`,
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("ddg timeout")), timeoutMs)
      ),
    ])) as Response;
    if (!res.ok) return null;
    const html = await Promise.race([
      res.text(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("ddg text timeout")), 5000)
      ),
    ]) as string;
    const results: string[] = [];
    const rowRegex = /<tr>[\s\S]*?<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;
    let inResults = false;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const row = rowMatch[0];
      if (row.includes('class="result-header"')) { inResults = true; continue; }
      if (!inResults) continue;
      if (row.includes('class="result--more"')) break;
      const linkMatch = /<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(row);
      const snippetMatch = /<td class="result-snippet">([\s\S]*?)<\/td>/i.exec(row);
      if (!linkMatch) continue;
      const url = linkMatch[1].includes("http") ? linkMatch[1] : `https://${linkMatch[1]}`;
      const title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
      const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "";
      if (title && url) {
        results.push(`${results.length + 1}. ${title}\n   URL: ${url}\n   ${snippet}`);
      }
    }
    if (results.length === 0) return null;
    return `Search results for "${query}":\n\n${results.slice(0, 10).join("\n\n")}`;
  } catch {
    return null;
  }
}

// ── web_search ────────────────────────────────────────────────────────

async function execWebSearch(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const query = String(args.query || "").trim();
  if (!query)
    return errorResult(toolCallId, "web_search", "Query is required.");

  const maxResults = Math.min(Math.max(Number(args.max_results) || 5, 1), 10);
  const result = await aiWebSearch(query, maxResults);

  if (result) {
    return {
      tool_call_id: toolCallId,
      role: "tool",
      name: "web_search",
      content: result,
    };
  }

  return {
    tool_call_id: toolCallId,
    role: "tool",
    name: "web_search",
    content: `No search results found for "${query}".`,
  };
}

// ── Blocked commands ───────────────────────────────────────────────────

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

// ── write_file ─────────────────────────────────────────────────────────

async function execWriteFile(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  const content = String(args.content ?? "");
  if (!rawPath) return errorResult(toolCallId, "write_file", "Path is required.");

  const resolved = resolvePath(rawPath);
  if (!isAllowedPath(resolved)) {
    return errorResult(
      toolCallId, "write_file",
      `Access denied: "${resolved}" is outside allowed directories.`
    );
  }

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    return errorResult(
      toolCallId, "write_file",
      `Parent directory does not exist: "${dir}". Create it first with run_command (mkdir).`
    );
  }

  try {
    fs.writeFileSync(resolved, content, "utf-8");
    return {
      tool_call_id: toolCallId,
      role: "tool",
      name: "write_file",
      content: `Successfully wrote ${content.length} bytes to "${rawPath}".`,
    };
  } catch (e) {
    return errorResult(
      toolCallId, "write_file",
      `Failed to write file: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

// ── delete_file ────────────────────────────────────────────────────────

async function execDeleteFile(
  args: Record<string, unknown>,
  toolCallId: string
): Promise<ToolCallResult> {
  const rawPath = String(args.path || "").trim();
  if (!rawPath) return errorResult(toolCallId, "delete_file", "Path is required.");

  const resolved = resolvePath(rawPath);
  if (!isAllowedPath(resolved)) {
    return errorResult(
      toolCallId, "delete_file",
      `Access denied: "${resolved}" is outside allowed directories.`
    );
  }

  if (!fs.existsSync(resolved)) {
    return errorResult(toolCallId, "delete_file", `File not found: "${rawPath}".`);
  }

  if (!fs.statSync(resolved).isFile()) {
    return errorResult(toolCallId, "delete_file", `"${rawPath}" is not a file (use run_command for directories).`);
  }

  try {
    fs.unlinkSync(resolved);
    return {
      tool_call_id: toolCallId,
      role: "tool",
      name: "delete_file",
      content: `Successfully deleted "${rawPath}".`,
    };
  } catch (e) {
    return errorResult(
      toolCallId, "delete_file",
      `Failed to delete: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

// ── copy_file ──────────────────────────────────────────────────────────

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

  if (!isAllowedPath(src)) {
    return errorResult(toolCallId, "copy_file", `Access denied: source "${src}" is outside allowed directories.`);
  }
  if (!isAllowedPath(dst)) {
    return errorResult(toolCallId, "copy_file", `Access denied: destination "${dst}" is outside allowed directories.`);
  }

  if (!fs.existsSync(src)) {
    return errorResult(toolCallId, "copy_file", `Source not found: "${rawSrc}".`);
  }

  try {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dst, { recursive: true });
    } else {
      fs.cpSync(src, dst);
    }
    return {
      tool_call_id: toolCallId,
      role: "tool",
      name: "copy_file",
      content: `Successfully copied "${rawSrc}" → "${rawDst}".`,
    };
  } catch (e) {
    return errorResult(
      toolCallId, "copy_file",
      `Failed to copy: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

// ── run_command ────────────────────────────────────────────────────────

const COMMAND_TIMEOUT = 120_000;

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
      const truncated =
        output.length > 50000
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
      const truncated =
        combined.length > 50000
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

function errorResult(
  toolCallId: string,
  name: string,
  message: string
): ToolCallResult {
  return {
    tool_call_id: toolCallId,
    role: "tool",
    name,
    content: `Error: ${message}`,
  };
}
