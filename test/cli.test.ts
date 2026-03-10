import test from "node:test";
import assert from "node:assert/strict";

import { runCli } from "../src/cli.ts";

test("runCli commit creates a commit from staged changes", async () => {
  const messages: string[] = [];
  const commits: string[] = [];

  const exitCode = await runCli(["commit", "--yes"], {
    cwd: "/repo",
    env: {
      ...process.env,
      OPENROUTER_API_KEY: "test-key",
    },
    output: {
      info(message: string) {
        messages.push(message);
      },
      error(message: string) {
        messages.push(message);
      },
    },
    prompt: {
      async confirm() {
        return true;
      },
    },
    gitClient: {
      ensureGitAvailable() {},
      resolveRepoRoot() {
        return "/repo";
      },
      getStagedDiff() {
        return "diff --git a/file.txt b/file.txt";
      },
      hasWorkingTreeChanges() {
        return true;
      },
      stageAllChanges() {},
      commitWithMessage(_, message) {
        commits.push(message);
      },
      switchToNewBranch() {},
      pushCurrentBranch() {
        return "main";
      },
      createPullRequest() {},
    },
    async generateCommitMessage() {
      return "feat: add hello file";
    },
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(commits, ["feat: add hello file"]);
  assert.ok(messages.some((message) => message.includes("Commit created.")));
});

test("runCli commit prompts to stage all when nothing is staged", async () => {
  const messages: string[] = [];
  const commits: string[] = [];
  let staged = false;
  let confirmCalls = 0;

  const exitCode = await runCli(["commit"], {
    cwd: "/repo",
    env: {
      ...process.env,
      OPENROUTER_API_KEY: "test-key",
    },
    output: {
      info(message: string) {
        messages.push(message);
      },
      error(message: string) {
        messages.push(message);
      },
    },
    prompt: {
      async confirm(message: string) {
        confirmCalls += 1;
        if (message.includes("Stage all")) {
          return true;
        }

        return true;
      },
    },
    gitClient: {
      ensureGitAvailable() {},
      resolveRepoRoot() {
        return "/repo";
      },
      getStagedDiff() {
        return staged ? "diff --git a/file.txt b/file.txt" : "";
      },
      hasWorkingTreeChanges() {
        return true;
      },
      stageAllChanges() {
        staged = true;
      },
      commitWithMessage(_, message) {
        commits.push(message);
      },
      switchToNewBranch() {},
      pushCurrentBranch() {
        return "main";
      },
      createPullRequest() {},
    },
    async generateCommitMessage() {
      return "feat: stage and commit changes";
    },
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(commits, ["feat: stage and commit changes"]);
  assert.equal(confirmCalls, 2);
  assert.ok(messages.some((message) => message.includes("Staging all changes.")));
});

test("runCli commit --all stages without prompting first", async () => {
  const commits: string[] = [];
  let staged = false;
  let confirmCalls = 0;

  const exitCode = await runCli(["commit", "--all", "--yes"], {
    cwd: "/repo",
    env: {
      ...process.env,
      OPENROUTER_API_KEY: "test-key",
    },
    output: {
      info() {},
      error() {},
    },
    prompt: {
      async confirm() {
        confirmCalls += 1;
        return true;
      },
    },
    gitClient: {
      ensureGitAvailable() {},
      resolveRepoRoot() {
        return "/repo";
      },
      getStagedDiff() {
        return staged ? "diff --git a/file.txt b/file.txt" : "";
      },
      hasWorkingTreeChanges() {
        return true;
      },
      stageAllChanges() {
        staged = true;
      },
      commitWithMessage(_, message) {
        commits.push(message);
      },
      switchToNewBranch() {},
      pushCurrentBranch() {
        return "main";
      },
      createPullRequest() {},
    },
    async generateCommitMessage() {
      return "feat: add staged changes";
    },
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(commits, ["feat: add staged changes"]);
  assert.equal(confirmCalls, 0);
});

test("runCli push sets upstream when missing", async () => {
  const output: string[] = [];
  const exitCode = await runCli(["push"], {
    cwd: "/repo",
    env: {
      ...process.env,
      OPENROUTER_API_KEY: "unused-for-push",
    },
    output: {
      info(message: string) {
        output.push(message);
      },
      error(message: string) {
        output.push(message);
      },
    },
    gitClient: {
      ensureGitAvailable() {},
      resolveRepoRoot() {
        return "/repo";
      },
      getStagedDiff() {
        return "";
      },
      hasWorkingTreeChanges() {
        return false;
      },
      stageAllChanges() {},
      commitWithMessage() {},
      switchToNewBranch() {},
      pushCurrentBranch() {
        return "feature/pushed";
      },
      createPullRequest() {},
    },
  });

  assert.equal(exitCode, 0);
  assert.ok(output.some((message) => message.includes("Pushed branch")));
});
