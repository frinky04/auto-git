import { UserError } from "./errors.ts";
import type { AppConfig, OpenRouterRequest } from "./types.ts";

export async function generateCommitMessage(
  config: AppConfig,
  request: OpenRouterRequest,
  fetchImpl: typeof fetch,
): Promise<string> {
  const body = {
    model: request.model,
    messages: [
      {
        role: "system",
        content: request.systemPrompt,
      },
      {
        role: "user",
        content: buildUserPrompt(request.diff, request.repoRoot),
      },
    ],
    temperature: 0.2,
    ...(buildReasoningBody(request.reasoningMode) ?? {}),
  };

  const response = await fetchImpl(`${trimTrailingSlash(config.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/",
      "X-Title": "autogit",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new UserError(`OpenRouter request failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const content = json.choices?.[0]?.message?.content;
  const text = flattenMessageContent(content);
  const sanitized = sanitizeCommitMessage(text);

  if (!sanitized) {
    throw new UserError("OpenRouter returned an empty commit message.");
  }

  return sanitized;
}

export function sanitizeCommitMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "";
  }

  let cleaned = trimmed.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "");
  cleaned = cleaned.replace(/\r\n/g, "\n").trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    try {
      cleaned = JSON.parse(cleaned);
    } catch {
      cleaned = cleaned.slice(1, -1).trim();
    }
  }

  const lines = cleaned
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, index, array) => !(line === "" && array[index - 1] === ""));

  return lines.join("\n").trim();
}

function buildUserPrompt(diff: string, repoRoot: string): string {
  return `Repository root: ${repoRoot}

Write a git commit message for this staged diff.
Rules:
- Prefer Conventional Commit style when it fits.
- Keep the subject line concise and imperative.
- Include a body only if it adds useful context.
- Return only the commit message.

Staged diff:
${diff}`;
}

function flattenMessageContent(
  content: string | Array<{ type?: string; text?: string }> | undefined,
): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" || !part.type ? part.text ?? "" : ""))
      .join("")
      .trim();
  }

  return "";
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function buildReasoningBody(mode: OpenRouterRequest["reasoningMode"]):
  | { reasoning: { enabled: true } | { effort: "none" } }
  | undefined {
  if (mode === "on") {
    return { reasoning: { enabled: true } };
  }

  if (mode === "off") {
    return { reasoning: { effort: "none" } };
  }

  return undefined;
}
