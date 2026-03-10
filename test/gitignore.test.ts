import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildGitignoreUpdate, detectIgnoreSections } from "../src/gitignore.ts";

test("detectIgnoreSections adds Node.js entries when package.json exists", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "autogit-gitignore-"));
  fs.writeFileSync(path.join(tempDir, "package.json"), '{"name":"demo"}');

  const sections = detectIgnoreSections(tempDir);
  const nodeSection = sections.find((section) => section.title === "Node.js");

  assert.ok(nodeSection);
  assert.ok(nodeSection?.entries.includes("node_modules/"));
});

test("buildGitignoreUpdate preserves existing entries and adds only missing ones", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "autogit-gitignore-"));
  fs.writeFileSync(path.join(tempDir, ".gitignore"), "node_modules/\n");

  const result = buildGitignoreUpdate(tempDir, [
    {
      title: "Node.js",
      entries: ["node_modules/", "dist/"],
    },
  ]);

  assert.deepEqual(result.addedEntries, ["dist/"]);
  assert.match(result.nextContent, /node_modules\/\n\n# Node\.js\ndist\/\n$/);
});
