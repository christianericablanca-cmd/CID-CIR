"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Copy,
  Check,
  File,
  FileText,
  Globe,
  HardDrive,
  Loader2,
  Paperclip,
  Send,
  Square,
  Trash2,
  User,
  Sparkles,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/copy-button";

const SUGGESTIONS = [
  "What are the top OSINT frameworks?",
  "Explain the difference between deep web and dark web",
  "How do I analyze HTTP headers for security?",
  "What tools are best for reconnaissance?",
];

const TEXT_EXTENSIONS = new Set([
  "txt", "csv", "json", "xml", "log", "md",
  "py", "js", "ts", "jsx", "tsx", "html", "css", "scss", "less",
  "sh", "bash", "zsh", "yaml", "yml", "toml",
  "ini", "cfg", "conf", "env", "sql",
  "rb", "go", "rs", "java", "kt", "scala",
  "php", "pl", "pm", "lua", "r", "m",
  "ps1", "bat", "cmd",
  "gradle", "sbt", "makefile", "dockerfile",
  "gitignore", "editorconfig",
  "docx", "pdf",
]);

const MAX_FILE_SIZE = 10 * 1_048_576; // 10 MB default per file
const MAX_FILE_SIZE_PDF = 5 * 1_048_576; // 5 MB for PDFs (slow to parse)
const MAX_FILE_SIZE_DOCX = 5 * 1_048_576; // 5 MB for DOCX
const MAX_FILES = 10;
const MAX_TOTAL_CHARS = 500_000; // total content across all files
const MAX_PDF_PAGES = 100; // stop parsing after this many pages

const FILE_CHIP_COLORS = [
  "border-accent/40 bg-accent/5",
  "border-emerald-500/40 bg-emerald-500/5",
  "border-violet-500/40 bg-violet-500/5",
  "border-amber-500/40 bg-amber-500/5",
  "border-rose-500/40 bg-rose-500/5",
  "border-cyan-500/40 bg-cyan-500/5",
  "border-orange-500/40 bg-orange-500/5",
  "border-pink-500/40 bg-pink-500/5",
  "border-teal-500/40 bg-teal-500/5",
  "border-indigo-500/40 bg-indigo-500/5",
];

interface AttachedFile {
  name: string;
  size: number;
  content: string;
  parsing?: boolean;
  parsingProgress?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; size: number }[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
        <Bot className="size-4 text-accent" />
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2.5">
        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function CodeBlock({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"code"> & {
  className?: string;
  children?: React.ReactNode;
}) {
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");

  if (match) {
    return (
      <div className="group relative my-2 overflow-hidden rounded-md border border-border">
        <div className="flex items-center justify-between bg-secondary px-3 py-1.5 text-xs text-muted">
          <span>{match[1]}</span>
          <CopyButton value={code} label="Copy" />
        </div>
        <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code
      className="rounded bg-secondary px-1.5 py-0.5 text-sm font-mono text-accent"
      {...props}
    >
      {children}
    </code>
  );
}

function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted hover:bg-secondary hover:text-foreground"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function FileChip({
  file,
  index,
  onRemove,
  disabled,
}: {
  file: AttachedFile;
  index: number;
  onRemove: () => void;
  disabled: boolean;
}) {
  const colorClass =
    FILE_CHIP_COLORS[index % FILE_CHIP_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${colorClass}`}
    >
      {file.parsing ? (
        <Loader2 className="size-3.5 animate-spin text-accent" />
      ) : (
        <FileText className="size-3.5 text-accent" />
      )}
      <span className="max-w-[160px] truncate font-medium text-foreground">
        {file.name}
      </span>
      <span className="shrink-0 text-muted">{formatSize(file.size)}</span>
      {file.parsing && (
        <span className="shrink-0 text-[10px] text-muted">{file.parsingProgress || "Parsing..."}</span>
      )}
      <button
        onClick={onRemove}
        disabled={disabled || file.parsing}
        className="ml-0.5 rounded p-0.5 text-muted transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  );
}

async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parsePdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const totalPages = Math.min(doc.numPages, MAX_PDF_PAGES);
  const pages: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages);
    const page = await doc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(" ");
    pages.push(text);
  }

  let result = pages.map((p, i) => `[Page ${i + 1}]\n${p}`).join("\n\n");

  if (doc.numPages > MAX_PDF_PAGES) {
    result += `\n\n[... parsing stopped at ${MAX_PDF_PAGES} pages; the PDF has ${doc.numPages} total pages ...]`;
  }

  return result;
}

export function AiChatTool() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm **CID's AI assistant** \u2014 your OSINT and cybersecurity co-pilot.\n\nI can analyze **multiple files at once** and correlate them. Upload documents, logs, code, or data files and ask me to find patterns, cross-reference data, or compare contents.\n\nWhen you **grant file & web access** (toggle above), I can also read local files, explore directories, fetch web pages, and search the internet.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [toolsEnabled, setToolsEnabled] = React.useState(false);
  const [attachedFiles, setAttachedFiles] = React.useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [abortController, setAbortController] =
    React.useState<AbortController | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const totalChars = attachedFiles.reduce((s, f) => s + f.content.length, 0);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function autoResize() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }

  function getExtension(name: string): string {
    const i = name.lastIndexOf(".");
    return i === -1 ? "" : name.slice(i + 1).toLowerCase();
  }

  function getMaxFileSize(name: string): number {
    const ext = getExtension(name);
    if (ext === "pdf") return MAX_FILE_SIZE_PDF;
    if (ext === "docx") return MAX_FILE_SIZE_DOCX;
    return MAX_FILE_SIZE;
  }

  function isValidFile(name: string, size: number): string | null {
    const ext = getExtension(name);
    if (!TEXT_EXTENSIONS.has(ext) && ext !== "") {
      return `Unsupported file type ".${ext}". Accepted: ${[...TEXT_EXTENSIONS].slice(0, 10).join(", ")}...`;
    }
    const maxSize = getMaxFileSize(name);
    if (size > maxSize) {
      return `File too large (${formatSize(size)}). Maximum for .${ext} files is ${formatSize(maxSize)}.`;
    }
    return null;
  }

  function addFile(file: AttachedFile) {
    setAttachedFiles((prev) => [...prev, file]);
  }

  function updateFile(index: number, update: Partial<AttachedFile>) {
    setAttachedFiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...update };
      return next;
    });
  }

  async function readFile(file: File): Promise<void> {
    const error = isValidFile(file.name, file.size);
    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**File error:** ${error}`,
        },
      ]);
      return;
    }

    if (attachedFiles.length >= MAX_FILES) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Limit reached:** Maximum of ${MAX_FILES} files per message. Remove some files before adding more.`,
        },
      ]);
      return;
    }

    const ext = getExtension(file.name);
    const idx = attachedFiles.length;
    addFile({ name: file.name, size: file.size, content: "", parsing: true });

    try {
      let text: string;

      if (ext === "docx") {
        text = await parseDocx(file);
      } else if (ext === "pdf") {
        text = await parsePdf(file, (current, total) => {
          updateFile(idx, {
            parsingProgress: `Page ${current}/${total}`,
          });
        });
      } else {
        text = await file.text();
      }

      const truncated =
        text.length > 200000
          ? text.slice(0, 200000) +
            `\n\n[... file truncated at 200,000 characters ...]`
          : text.trim() || "(empty file)";

      const overLimit =
        totalChars + truncated.length > MAX_TOTAL_CHARS;
      const finalContent = overLimit
        ? truncated.slice(0, MAX_TOTAL_CHARS - totalChars) +
          `\n\n[... content truncated — total ${formatSize(MAX_TOTAL_CHARS)} limit across all files ...]`
        : truncated;

      updateFile(idx, { content: finalContent, parsing: false });

      if (overLimit) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `**Notice:** Total content across all files exceeded ${formatSize(MAX_TOTAL_CHARS)}. Some file content was truncated.`,
          },
        ]);
      }
    } catch {
      updateFile(idx, { content: "", parsing: false });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `**Error:** Could not read "${file.name}". The file may be corrupted or encrypted.`,
        },
      ]);
      removeFile(idx);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const f of files) readFile(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    for (const f of files) readFile(f);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function buildApiContent(text: string, files: AttachedFile[]): string {
    const validFiles = files.filter((f) => f.content && !f.parsing);
    if (validFiles.length === 0) return text;

    const fileBlocks = validFiles
      .map(
        (f, i) =>
          `[File ${i + 1}: ${f.name} (${formatSize(f.size)})]\n\`\`\`\n${f.content}\n\`\`\``
      )
      .join("\n\n");

    if (!text) {
      const prompts: string[] = [];
      if (validFiles.length > 1) {
        prompts.push(
          `I have uploaded ${validFiles.length} files. Please analyze each one and then correlate them — identify common patterns, relationships, shared indicators, or discrepancies between them.`
        );
      } else {
        prompts.push("Analyze the following file:");
      }
      return `${prompts.join(" ")}\n\n${fileBlocks}`;
    }

    return `${text}\n\n${fileBlocks}`;
  }

  async function handleSend() {
    const text = input.trim();
    const readyFiles = attachedFiles.filter((f) => f.content && !f.parsing);
    if ((!text && readyFiles.length === 0) || loading) return;

    const apiContent = buildApiContent(text, attachedFiles);

    const userMessage: Message = {
      role: "user",
      content: text || (readyFiles.length > 0 ? `(${readyFiles.length} file(s) attached)` : ""),
      files: readyFiles.map((f) => ({ name: f.name, size: f.size })),
    };
    const assistantMessage: Message = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setAttachedFiles([]);
    setLoading(true);
    autoResize();

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const history = [
        ...messages,
        { role: "user", content: apiContent } as Message,
      ];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          tools_enabled: toolsEnabled,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ error: "Request failed" }));
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: `**Error:** ${err.error}`,
          };
          return next;
        });
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            content: last.content + chunk,
          };
          return next;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            content: last.content + "\n\n*\[Response cancelled\]*",
          };
          return next;
        });
      } else {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: "**Error:** Connection failed. Please try again.",
          };
          return next;
        });
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }

  function handleStop() {
    abortController?.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    if (abortController) abortController.abort();
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. Ready for your next questions.",
      },
    ]);
    setInput("");
    setAttachedFiles([]);
    setLoading(false);
  }

  function handleClickAttach() {
    fileInputRef.current?.click();
  }

  const canSend =
    input.trim() ||
    attachedFiles.some((f) => f.content && !f.parsing);

  const acceptExtensions = [...TEXT_EXTENSIONS].map((e) => `.${e}`).join(",");

  return (
    <div
      className={`flex h-[650px] flex-col rounded-lg border bg-card transition-all ${
        dragOver
          ? "border-accent shadow-[0_0_0_2px_rgba(59,130,246,0.3)]"
          : "border-border"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-accent/10">
            <Bot className="size-4 text-accent" />
          </div>
          <div>
            <span className="text-sm font-medium">AI Chat</span>
            <span className="ml-2 text-[10px] text-muted">OSINT Co-pilot</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setToolsEnabled(!toolsEnabled)}
            disabled={loading}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors disabled:opacity-40 ${
              toolsEnabled
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-accent hover:text-accent"
            }`}
            title={
              toolsEnabled
                ? "File & web access enabled"
                : "Grant file & web access"
            }
          >
            <Globe className="size-3" />
            <HardDrive className="size-3" />
            <span className="hidden sm:inline">
              {toolsEnabled ? "Access On" : "Access Off"}
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={messages.length <= 1 && attachedFiles.length === 0}
          >
            <Trash2 className="size-4" />
            <span className="ml-1 hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        accept={acceptExtensions}
        className="hidden"
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`group flex gap-3 ${
                  msg.role === "user" ? "justify-end" : ""
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Bot className="size-4 text-accent" />
                  </div>
                )}
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="ai-chat-message">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            code: CodeBlock,
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div>
                        {msg.files && msg.files.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {msg.files.map((f, fi) => (
                              <span
                                key={fi}
                                className="flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[10px]"
                              >
                                <File className="size-3" />
                                {f.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                  <MessageActions content={msg.content} />
                </div>
                {msg.role === "user" && (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent">
                    <User className="size-4 text-accent-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && messages[messages.length - 1]?.content === "" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        {messages.length === 1 &&
          attachedFiles.length === 0 &&
          !loading && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    textareaRef.current?.focus();
                  }}
                  className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <Sparkles className="size-3" />
                  {s}
                </button>
              ))}
            </div>
          )}

        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {attachedFiles.map((f, i) => (
                  <FileChip
                    key={`${f.name}-${i}`}
                    file={f}
                    index={i}
                    onRemove={() => removeFile(i)}
                    disabled={loading}
                  />
                ))}
                {attachedFiles.length >= 2 && (
                  <span className="text-[10px] text-muted">
                    {attachedFiles.filter((f) => f.content && !f.parsing)
                      .length >= 2
                      ? "Ready to correlate"
                      : "Parsing..."}
                  </span>
                )}
              </div>
              {totalChars > MAX_TOTAL_CHARS * 0.8 && (
                <div className="mb-2 flex items-center gap-1.5 text-[10px] text-warning">
                  <AlertTriangle className="size-3" />
                  <span>
                    Content approaching limit ({formatSize(totalChars)} /{" "}
                    {formatSize(MAX_TOTAL_CHARS)})
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <button
            onClick={handleClickAttach}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
            title="Attach file"
          >
            <Paperclip className="size-4" />
          </button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedFiles.length > 0
                ? attachedFiles.length >= 2
                  ? "Ask to correlate, compare, or cross-reference the files..."
                  : "Ask about the attached file..."
                : "Ask about OSINT, cybersecurity, the deep web..."
            }
            disabled={loading}
            rows={1}
            className="min-h-[40px] resize-none"
          />
          {loading ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStop}
              className="h-10 shrink-0"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleSend}
              disabled={!canSend}
              className="h-10 shrink-0"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-muted">
          Supports .txt, .csv, .json, .xml, .log, .md, .pdf, .docx, code
          files &middot; Up to {MAX_FILES} files &middot;{" "}
          {formatSize(MAX_TOTAL_CHARS)} total &middot; {" "}
          {formatSize(MAX_FILE_SIZE)} max per file (PDF/DOCX:{" "}
          {formatSize(MAX_FILE_SIZE_PDF)}) &middot; Drag & drop
        </p>
      </div>
    </div>
  );
}
