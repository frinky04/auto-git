import test from "node:test";
import assert from "node:assert/strict";

import { parseArgs } from "../src/args.ts";

test("parseArgs handles commit flags", () => {
  const parsed = parseArgs(["commit", "--model", "openai/gpt-4o-mini", "--yes", "--all"]);

  assert.equal(parsed.name, "commit");
  assert.equal(parsed.flags.model, "openai/gpt-4o-mini");
  assert.equal(parsed.flags.yes, true);
  assert.equal(parsed.flags.all, true);
});

test("parseArgs handles branch-commit positional branch", () => {
  const parsed = parseArgs(["branch-commit", "feature/test"]);

  assert.equal(parsed.name, "branch-commit");
  assert.deepEqual(parsed.positionals, ["feature/test"]);
});
