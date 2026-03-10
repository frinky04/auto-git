export type OutputWriter = {
  info(message: string): void;
  error(message: string): void;
};

export type PromptHandler = {
  confirm(message: string): Promise<boolean>;
};

export type CommandDependencies = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  output?: OutputWriter;
  prompt?: PromptHandler;
  fetchImpl?: typeof fetch;
  gitClient?: GitClient;
  generateCommitMessage?: CommitMessageGenerator;
};

export type ParsedCommand = {
  name: "commit" | "push" | "pr" | "branch-commit" | "help";
  flags: Record<string, string | boolean>;
  positionals: string[];
};

export type AppConfig = {
  apiKey?: string;
  model: string;
  baseUrl: string;
  systemPrompt: string;
  defaultBaseBranch?: string;
};

export type OpenRouterRequest = {
  model: string;
  systemPrompt: string;
  diff: string;
  repoRoot: string;
};

export type GitClient = {
  ensureGitAvailable(cwd: string): void;
  resolveRepoRoot(cwd: string): string;
  getStagedDiff(cwd: string): string;
  hasWorkingTreeChanges(cwd: string): boolean;
  stageAllChanges(cwd: string): void;
  commitWithMessage(cwd: string, message: string): void;
  switchToNewBranch(cwd: string, branchName: string): void;
  pushCurrentBranch(cwd: string): string;
  createPullRequest(
    cwd: string,
    options: {
      base?: string;
      title?: string;
      body?: string;
    },
  ): void;
};

export type CommitMessageGenerator = (
  config: AppConfig & { apiKey: string },
  request: OpenRouterRequest,
  fetchImpl: typeof fetch,
) => Promise<string>;
