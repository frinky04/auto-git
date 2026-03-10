import test from "node:test";
import assert from "node:assert/strict";

import { generateCommitMessage, sanitizeCommitMessage } from "../src/openrouter.ts";

test("sanitizeCommitMessage removes code fences", () => {
  const message = sanitizeCommitMessage("```text\nfeat: add cli\n```");
  assert.equal(message, "feat: add cli");
});

test("sanitizeCommitMessage preserves subject and body", () => {
  const message = sanitizeCommitMessage(' "fix: trim output\\n\\nRemove duplicate blank lines" ');
  assert.equal(message, "fix: trim output\n\nRemove duplicate blank lines");
});

test("generateCommitMessage omits reasoning in auto mode", async () => {
  let body: Record<string, unknown> | undefined;

  const fetchImpl: typeof fetch = async (_, init) => {
    body = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "feat: disable reasoning" } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const message = await generateCommitMessage(
    {
      apiKey: "test-key",
      model: "minimax/minimax-m2.5",
      baseUrl: "https://openrouter.ai/api/v1",
      systemPrompt: "test prompt",
      reasoningMode: "auto",
    },
    {
      model: "minimax/minimax-m2.5",
      systemPrompt: "test prompt",
      diff: "diff --git a/file b/file",
      repoRoot: "/repo",
      reasoningMode: "auto",
    },
    fetchImpl,
  );

  assert.equal(message, "feat: disable reasoning");
  assert.equal(body?.reasoning, undefined);
});

test("generateCommitMessage enables reasoning when requested", async () => {
  let body: Record<string, unknown> | undefined;

  const fetchImpl: typeof fetch = async (_, init) => {
    body = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "feat: enable reasoning" } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const message = await generateCommitMessage(
    {
      apiKey: "test-key",
      model: "minimax/minimax-m2.5",
      baseUrl: "https://openrouter.ai/api/v1",
      systemPrompt: "test prompt",
      reasoningMode: "on",
    },
    {
      model: "minimax/minimax-m2.5",
      systemPrompt: "test prompt",
      diff: "diff --git a/file b/file",
      repoRoot: "/repo",
      reasoningMode: "on",
    },
    fetchImpl,
  );

  assert.equal(message, "feat: enable reasoning");
  assert.deepEqual(body?.reasoning, { enabled: true });
});

test("generateCommitMessage disables reasoning when requested", async () => {
  let body: Record<string, unknown> | undefined;

  const fetchImpl: typeof fetch = async (_, init) => {
    body = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "feat: disable reasoning explicitly" } }],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  const message = await generateCommitMessage(
    {
      apiKey: "test-key",
      model: "minimax/minimax-m2.5",
      baseUrl: "https://openrouter.ai/api/v1",
      systemPrompt: "test prompt",
      reasoningMode: "off",
    },
    {
      model: "minimax/minimax-m2.5",
      systemPrompt: "test prompt",
      diff: "diff --git a/file b/file",
      repoRoot: "/repo",
      reasoningMode: "off",
    },
    fetchImpl,
  );

  assert.equal(message, "feat: disable reasoning explicitly");
  assert.deepEqual(body?.reasoning, { effort: "none" });
});
