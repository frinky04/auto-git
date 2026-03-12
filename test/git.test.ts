import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { getCurrentBranch } from "../src/git.ts";

function runGit(cwd: string, args: string[]): string {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || `git ${args.join(" ")} failed`);
  }

  return result.stdout.trim();
}

test("getCurrentBranch works for repos with no commits", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "autogit-git-test-"));

  try {
    runGit(tempDir, ["init", "-q"]);

    const expected = runGit(tempDir, ["branch", "--show-current"]);
    const branchName = getCurrentBranch(tempDir);

    assert.equal(branchName, expected);
    assert.notEqual(branchName, "");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("getCurrentBranch returns short commit hash in detached HEAD", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "autogit-git-test-"));

  try {
    runGit(tempDir, ["init", "-q"]);
    fs.writeFileSync(path.join(tempDir, "file.txt"), "hello\n", "utf8");
    runGit(tempDir, ["add", "file.txt"]);
    runGit(tempDir, ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-q", "-m", "init"]);
    runGit(tempDir, ["checkout", "-q", "--detach"]);

    const expected = runGit(tempDir, ["rev-parse", "--short", "HEAD"]);
    const branchName = getCurrentBranch(tempDir);

    assert.equal(branchName, expected);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
