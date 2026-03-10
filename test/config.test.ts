import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { loadConfig } from "../src/config.ts";

test("loadConfig prefers environment variables over config file", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "autogit-config-"));
  const configPath = path.join(tempDir, "autogit.config.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      apiKey: "file-key",
      model: "file-model",
    }),
  );

  const config = loadConfig(tempDir, {
    OPENROUTER_API_KEY: "env-key",
    AUTOGIT_MODEL: "env-model",
  });

  assert.equal(config.apiKey, "env-key");
  assert.equal(config.model, "env-model");
});

test("loadConfig defaults reasoning to auto", () => {
  const config = loadConfig(process.cwd(), {
    OPENROUTER_API_KEY: "env-key",
  });

  assert.equal(config.reasoningMode, "auto");
});

test("loadConfig enables reasoning from environment", () => {
  const config = loadConfig(process.cwd(), {
    OPENROUTER_API_KEY: "env-key",
    AUTOGIT_REASONING: "true",
  });

  assert.equal(config.reasoningMode, "on");
});

test("loadConfig disables reasoning from environment", () => {
  const config = loadConfig(process.cwd(), {
    OPENROUTER_API_KEY: "env-key",
    AUTOGIT_REASONING: "off",
  });

  assert.equal(config.reasoningMode, "off");
});
