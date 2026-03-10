import readline from "node:readline/promises";
import { stdin, stdout, stderr } from "node:process";

import type { OutputWriter, PromptHandler } from "./types.ts";

export function createConsoleOutput(): OutputWriter {
  return {
    info(message: string) {
      stdout.write(`${message}\n`);
    },
    error(message: string) {
      stderr.write(`${message}\n`);
    },
    stream(chunk: string) {
      stdout.write(chunk);
    },
    endStream() {
      stdout.write("\n");
    },
  };
}

export function createConsolePrompt(): PromptHandler {
  return {
    async confirm(message: string) {
      const rl = readline.createInterface({ input: stdin, output: stdout });

      try {
        const answer = await rl.question(`${message} [y/N] `);
        return /^y(es)?$/i.test(answer.trim());
      } finally {
        rl.close();
      }
    },
  };
}
