import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { UserError } from "./errors.ts";
import type { AppConfig } from "./types.ts";

type PartialConfig = Partial<AppConfig>;

const DEFAULT_MODEL = "minimax/minimax-m2.5";
const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_SYSTEM_PROMPT =
  "You write concise, high-signal git commit messages in Conventional Commit style when appropriate. Return only the commit message, with an optional body separated by a blank line. No code fences, no commentary.";

export function loadConfig(cwd: string, env: NodeJS.ProcessEnv): AppConfig {
  const fileConfig = loadConfigFile(cwd, env);

  return {
    apiKey: env.OPENROUTER_API_KEY ?? fileConfig.apiKey,
    model: env.AUTOGIT_MODEL ?? fileConfig.model ?? DEFAULT_MODEL,
    baseUrl: env.OPENROUTER_BASE_URL ?? fileConfig.baseUrl ?? DEFAULT_BASE_URL,
    systemPrompt:
      env.AUTOGIT_SYSTEM_PROMPT ?? fileConfig.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    defaultBaseBranch:
      env.AUTOGIT_DEFAULT_BASE_BRANCH ?? fileConfig.defaultBaseBranch,
  };
}

function loadConfigFile(cwd: string, env: NodeJS.ProcessEnv): PartialConfig {
  const candidatePaths = [
    env.AUTOGIT_CONFIG,
    path.join(cwd, "autogit.config.json"),
    path.join(os.homedir(), ".config", "autogit", "config.json"),
  ].filter((value): value is string => Boolean(value));

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }

    const raw = fs.readFileSync(candidatePath, "utf8");
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new UserError(`Invalid JSON in config file: ${candidatePath}`);
    }

    return normalizeConfig(parsed, candidatePath);
  }

  return {};
}

function normalizeConfig(value: unknown, sourcePath: string): PartialConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new UserError(`Config file must contain a JSON object: ${sourcePath}`);
  }

  const config = value as Record<string, unknown>;
  const normalized: PartialConfig = {};

  copyString(config, normalized, "apiKey");
  copyString(config, normalized, "model");
  copyString(config, normalized, "baseUrl");
  copyString(config, normalized, "systemPrompt");
  copyString(config, normalized, "defaultBaseBranch");

  return normalized;
}

function copyString(
  source: Record<string, unknown>,
  target: PartialConfig,
  key: keyof AppConfig,
): void {
  const value = source[key];

  if (value === undefined) {
    return;
  }

  if (typeof value !== "string") {
    throw new UserError(`Config field "${key}" must be a string.`);
  }

  target[key] = value;
}

export function requireApiKey(config: AppConfig): AppConfig & { apiKey: string } {
  if (!config.apiKey) {
    throw new UserError(
      "Missing OPENROUTER_API_KEY. Set it in your environment or define apiKey in autogit.config.json.",
    );
  }

  return config as AppConfig & { apiKey: string };
}
