import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeCommitMessage } from "../src/openrouter.ts";

test("sanitizeCommitMessage removes code fences", () => {
  const message = sanitizeCommitMessage("```text\nfeat: add cli\n```");
  assert.equal(message, "feat: add cli");
});

test("sanitizeCommitMessage preserves subject and body", () => {
  const message = sanitizeCommitMessage(' "fix: trim output\\n\\nRemove duplicate blank lines" ');
  assert.equal(message, "fix: trim output\n\nRemove duplicate blank lines");
});
