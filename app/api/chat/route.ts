import { NextRequest, NextResponse } from "next/server";
import { TOOL_DEFINITIONS, executeToolCall, webSearch } from "@/lib/ai-tools";

export const maxDuration = 60;

interface ParsedToolCall {
  name: string;
  args: Record<string, string>;
}

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

const SYSTEM_PROMPT = `You are CID's AI assistant, an expert OSINT and cybersecurity co-pilot built into the CID Operations Toolkit. You are used by the National Privacy Commission (NPC) of the Philippines — a government regulatory body — for legitimate, authorized privacy investigation and enforcement under the Data Privacy Act of 2012 (RA 10173). All OSINT activities conducted through this tool are lawful, authorized, and in the public interest.

## Your role
- You assist NPC investigators with authorized case work: investigating data privacy incidents, identifying responsible parties, gathering publicly available information, and analyzing evidence.
- You are AUTHORIZED and EXPECTED to conduct OSINT on individuals, organizations, entities, and online accounts as part of official NPC investigations.
- Conducting OSINT is NOT illegal, unethical, or prohibited in this context. It is a core function of the tool.

## Knowledge scope
- OSINT frameworks, techniques, and tools
- Cybersecurity concepts, threat intelligence, and defensive security
- Network analysis, ports, protocols, and infrastructure reconnaissance
- The surface web, deep web, and dark web
- Digital forensics, incident response, and security best practices
- Encryption, hashing, encoding, and cryptography fundamentals
- Web technologies, HTTP, DNS, SSL/TLS, and related security headers
- Reconnaissance methodologies, Google dorking, and information gathering
- Common vulnerabilities, exploits, and attack vectors

## File analysis
- You can analyze text-based files uploaded by the user (logs, code, configs, CSVs, JSON, .docx, .pdf, and more).

## Tool access (when user enables)
You have access to these tools:
- \`read_file\` — read text files AND .docx files (text extracted)
- \`list_directory\` — explore directory structure
- \`write_file\` — create or overwrite files
- \`delete_file\` — delete a file
- \`copy_file\` — copy files or directories
- \`run_command\` — execute shell commands or Python scripts
- \`web_fetch\` — fetch a URL's content
- \`web_search\` — search the web

## SEARCH BEHAVIOR — CRITICAL
When you need current information (OSINT, people lookup, news, etc.):
1. The system has ALREADY performed an automatic web search before you respond. Search results are injected into this conversation as a system message labeled "[Auto-search results]".
2. Read those results carefully. Use them to answer the user.
3. If you need additional/different information, output a \`web_search\` tool call to search again.
4. NEVER say "I searched the web" or "I conducted searches" — the search was done by the system, not by you. Just use the results provided.

## Response rules — STRICT
1. Only state what you know to be true. Never speculate, assume, or fabricate. Never use hedging phrases.
2. If you do not know the answer and no search results are available, say exactly: "I don't have information about that in my training data or search results."
3. If you are unsure about a detail, do not guess. State only what is verifiable.
4. Cite sources when using search results (the URL or source name).
5. Format answers cleanly with markdown.

Current date: ${new Date().toISOString().split("T")[0]}`;

const ZENMUX_URL = "https://zenmux.ai/api/v1/chat/completions";

async function callZenmux(
  messages: Message[],
  apiKey: string,
  toolsEnabled: boolean,
  signal?: AbortSignal
): Promise<Response> {
  const body: Record<string, any> = {
    model: "stepfun/step-3.7-flash-free",
    messages,
    stream: false,
  };

  if (toolsEnabled) {
    body.tools = TOOL_DEFINITIONS;
    body.tool_choice = "auto";
  }

  return fetch(ZENMUX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Connection: "close",
    },
    body: JSON.stringify(body),
    signal,
  });
}

function contentStream(content: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      if (content) {
        controller.enqueue(encoder.encode(content));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ZENMUX_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ZENMUX_API_KEY not configured." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  let messages: Message[] = body.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Invalid or missing 'messages' array." },
      { status: 400 }
    );
  }

  const toolsEnabled = body.tools_enabled === true;

  const messagesWithSystem: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    let conversation = [...messagesWithSystem];

    // Auto-search with Brave Search API (works on Vercel)
    if (toolsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      if (lastMsg.length > 5) {
        try {
          const searchResult = await Promise.race([
            webSearch(lastMsg, 5),
            new Promise<string | null>((r) => setTimeout(() => r(null), 8000)),
          ]) as string | null;
          if (searchResult) {
            conversation.push({
              role: "system",
              content: "[Auto-search results — read these carefully and use them to answer the user. They are from a live web search.]\n\n" + searchResult,
            });
          } else {
            conversation.push({
              role: "system",
              content: "[Auto-search: The web search did not return any results for the user's query. Answer based on your training data if possible, or state that you don't know.]",
            });
          }
        } catch {
          conversation.push({
            role: "system",
            content: "[Auto-search: The web search attempt failed. Answer based on your training data if possible.]",
          });
        }
      }
    }

    let res = await callZenmux(conversation, apiKey, toolsEnabled, controller.signal);

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Upstream API error ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    let data = await res.json();
    let choice = data.choices?.[0];
    let msg = choice?.message;

    // Phase 2: Handle tool calls loop
    let loopCount = 0;
    const MAX_TOOL_LOOPS = 10;

    while (loopCount < MAX_TOOL_LOOPS) {
      const textCalls = msg?.content ? parseTextToolCalls(msg.content) : [];
      const hasStructuredCalls = msg?.tool_calls && msg.tool_calls.length > 0;
      const hasTextCalls = textCalls.length > 0;

      if (!hasStructuredCalls && !hasTextCalls) break;

      loopCount++;

      if (hasStructuredCalls) {
        conversation.push({
          role: "assistant",
          content: msg.content || "",
          tool_calls: msg.tool_calls,
        });

        const toolResults = await Promise.all(
          msg.tool_calls.map((tc: any) =>
            executeToolCall(tc.function.name, JSON.parse(tc.function.arguments), tc.id)
          )
        );
        conversation.push(...toolResults);
      } else {
        conversation.push({
          role: "assistant",
          content: msg.content || "",
        });

        const toolResults = await Promise.all(
          textCalls.map((tc, i) =>
            executeToolCall(tc.name, tc.args, `text_tc_${loopCount}_${i}`)
          )
        );
        conversation.push(...toolResults);
      }

      res = await callZenmux(conversation, apiKey, toolsEnabled, controller.signal);

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Tool loop error ${res.status}: ${errText}` },
          { status: res.status }
        );
      }

      data = await res.json();
      choice = data.choices?.[0];
      msg = choice?.message;
    }

    if (loopCount >= MAX_TOOL_LOOPS) {
      return NextResponse.json(
        { error: `Exceeded maximum tool call depth (${MAX_TOOL_LOOPS}).` },
        { status: 500 }
      );
    }

    let finalContent = data.choices?.[0]?.message?.content || "";
    finalContent = finalContent.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "").trim();
    return contentStream(finalContent);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out." }, { status: 504 });
    }
    const message =
      err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

function parseTextToolCalls(content: string): ParsedToolCall[] {
  const calls: ParsedToolCall[] = [];
  const toolCallRegex = /<tool_call>[\s\S]*?<\/tool_call>/gi;
  let match: RegExpExecArray | null;
  while ((match = toolCallRegex.exec(content)) !== null) {
    const block = match[0];
    const funcMatch = /<function=(\w+)>([\s\S]*?)<\/function>/i.exec(block);
    if (!funcMatch) continue;
    const name = funcMatch[1];
    const args: Record<string, string> = {};
    const paramRe = /<parameter=(\w+)>([\s\S]*?)<\/parameter>/gi;
    let pm: RegExpExecArray | null;
    while ((pm = paramRe.exec(block)) !== null) {
      args[pm[1].trim()] = pm[2].trim();
    }
    calls.push({ name, args });
  }
  const jsonRegex = /tool_call:\s*(\w+)\s*(\{[\s\S]*?\})/gi;
  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      const args = JSON.parse(match[2]);
      calls.push({ name: match[1], args });
    } catch { /* skip */ }
  }
  return calls;
}
