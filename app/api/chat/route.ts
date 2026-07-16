import { NextRequest, NextResponse } from "next/server";
import { TOOL_DEFINITIONS, executeToolCall, aiWebSearch } from "@/lib/ai-tools";

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

const SYSTEM_PROMPT = `You are CID's AI assistant, an expert OSINT and cybersecurity co-pilot built into the CID Operations Toolkit.

## Knowledge scope
Your training data covers:
- Open Source Intelligence (OSINT) frameworks, techniques, and tools
- Cybersecurity concepts, threat intelligence, and defensive security
- Network analysis, ports, protocols, and infrastructure reconnaissance
- The surface web, deep web, and dark web — their definitions, distinctions, and legitimate vs. illegal use cases
- Digital forensics, incident response, and security best practices
- Encryption, hashing, encoding, and cryptography fundamentals
- Web technologies, HTTP, DNS, SSL/TLS, and related security headers
- Reconnaissance methodologies, Google dorking, and information gathering
- Common vulnerabilities, exploits, and attack vectors

## File analysis
- You can analyze text-based files uploaded by the user (logs, code, configs, CSVs, JSON, .docx, .pdf, and more).
- When a file is provided, its content is included in the user's message.

## Tool access (when user enables)
You have access to these tools:
- \`read_file\` — read text files AND .docx files (text extracted). Cannot read PDF directly.
- \`list_directory\` — explore directory structure (up to 3 levels deep)
- \`write_file\` — create or overwrite files (scripts, reports, configs)
- \`delete_file\` — permanently delete a file (not directories)
- \`copy_file\` — copy files or directories from one location to another
- \`run_command\` — execute any shell command or Python script. Use this for:
  - Running Python scripts (e.g., \`python script.py\`)
  - Processing PDFs with Python (e.g., \`python -c "import PyPDF2; ..."\`)
  - Running git, npm, pip, or any CLI tool
  - Creating directories (\`mkdir\`), moving/renaming files (\`mv\`, \`rename\`)
  - OCR, image processing, data analysis
- \`web_fetch\` — retrieve content from a URL
- \`web_search\` — search the web for current information

## TOOL CALLING — YOU MUST USE THIS
When you need to use a tool, output EXACTLY one of these formats in your response. The system WILL detect it, run the tool, and give you the result.

**Format A (XML):**
<tool_call> <function=TOOL_NAME> <parameter=PARAM_NAME> VALUE </parameter> </function> </tool_call>

Example:
<tool_call> <function=web_search> <parameter=query> Mharfe Micaroz contact information </parameter> </function> </tool_call>

**Format B (JSON):**
TOOL_CALL: name {"param": "value"}

Example:
TOOL_CALL: web_search {"query": "Mharfe Micaroz"}

**CRITICAL RULES:**
- If the user asks for current info, SEARCH FIRST using a tool call. Do NOT answer without a tool call.
- If you say "I searched" without outputting a tool call, you are lying. The system will catch you.
- After the tool result returns, use it to formulate your answer.

## Response rules — STRICT
1. **Only state what you know to be true.** Never speculate, assume, or fabricate. Never use hedging phrases like "it may be", "it could be", "it might be", "I believe", "I think", "it is possible that", "it is likely that", "unverified", "allegedly", "purportedly", "reportedly", "supposedly", or any similar hedging language.
2. **If you do not know the answer**, say exactly: "I don't have information about that in my training data." If tools are enabled, use \`web_search\` or \`web_fetch\` to try to find the answer first. Only say you don't know after attempting to search.
3. **If you are unsure about a detail**, do not guess. State only what is verifiable.
4. **Distinguish clearly** between what is in your training data and what you retrieved from tools. When using tools, cite the source (URL or filename).
5. **For specific claims about people, organizations, or events**, use \`web_search\` to verify before answering if the information might be time-sensitive or outside your training data cutoff.
6. **Never provide guidance on illegal activities.** Distinguish between legal/ethical security research and illegal actions.
7. **Format answers cleanly** with markdown (headings, lists, code blocks, tables) where appropriate. For code, always specify the language for syntax highlighting.

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
    },
    body: JSON.stringify(body),
    signal,
  });
}

function parseTextToolCalls(content: string): ParsedToolCall[] {
  const calls: ParsedToolCall[] = [];

  // Format 1: <tool_call> <function=NAME> <parameter=KEY> VALUE </parameter> </function> </tool_call>
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

  // Format 2: TOOL_CALL: name {"key": "value"}  (case-insensitive)
  const jsonRegex = /tool_call:\s*(\w+)\s*(\{[\s\S]*?\})/gi;
  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      const args = JSON.parse(match[2]);
      calls.push({ name: match[1], args });
    } catch { /* skip malformed JSON */ }
  }

  return calls;
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
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    // Phase 1: If tools enabled, do an automatic web search with the user's
    // last message so the model has real-time context without needing to
    // output a tool call itself.
    let conversation = [...messagesWithSystem];

    if (toolsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      if (lastMsg.length > 5) {
        const searchPromise = aiWebSearch(lastMsg, 5);
        const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 10000));
        const autoSearchResult = await Promise.race([searchPromise, timeoutPromise]);
        if (autoSearchResult) {
          conversation.push({
            role: "system",
            content:
              "[Pre-search results for the user's query — use if relevant, otherwise ignore.]\n\n" +
              autoSearchResult,
          });
        }
      }
    }

    // Phase 1b: Non-streaming call (may also trigger tool calls)
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

    // Phase 2: Handle tool calls in a loop
    let loopCount = 0;
    const MAX_TOOL_LOOPS = 10;

    while (loopCount < MAX_TOOL_LOOPS) {
      // Check structured tool calls or text-based fallback
      const textCalls = msg?.content ? parseTextToolCalls(msg.content) : [];
      const hasStructuredCalls = msg?.tool_calls && msg.tool_calls.length > 0;
      const hasTextCalls = textCalls.length > 0;

      if (!hasStructuredCalls && !hasTextCalls) {
        // Debug: first iteration with tools enabled but no tool call detected
        if (loopCount === 0 && toolsEnabled) {
          console.log("[CID AI] No tool call detected in model response. Content preview:", msg?.content?.slice(0, 200));
        }
        break;
      }

      loopCount++;

      if (hasStructuredCalls) {
        // Native tool_calls format
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
        // Text-based fallback: parse <tool_call> tags
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

      // Call again with tool results included
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

    // Phase 3: Stream the final text response (data is already parsed)
    let finalContent = data.choices?.[0]?.message?.content || "";
    // Strip any leftover tool call tags
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
