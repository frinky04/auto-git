import readline from "node:readline/promises";
import { stdin, stdout, stderr } from "node:process";

import type { OutputWriter, PromptHandler } from "./types.ts";

export function createConsoleOutput(): OutputWriter {
  const spinnerFrames = ["-", "\\", "|", "/"];
  let spinnerTimer: NodeJS.Timeout | undefined;
  let spinnerFrameIndex = 0;
  let spinnerMessage = "";

  function clearSpinnerLine(): void {
    if (!stdout.isTTY) {
      return;
    }

    stdout.write("\r\x1b[2K");
  }

  function renderSpinner(): void {
    if (!stdout.isTTY || !spinnerTimer) {
      return;
    }

    const frame = spinnerFrames[spinnerFrameIndex % spinnerFrames.length];
    spinnerFrameIndex += 1;
    stdout.write(`\r${frame} ${spinnerMessage}`);
  }

  function pauseSpinner(): void {
    if (!spinnerTimer) {
      return;
    }

    clearInterval(spinnerTimer);
    spinnerTimer = undefined;
    clearSpinnerLine();
  }

  return {
    info(message: string) {
      pauseSpinner();
      stdout.write(`${message}\n`);
    },
    error(message: string) {
      pauseSpinner();
      stderr.write(`${message}\n`);
    },
    stream(chunk: string) {
      pauseSpinner();
      stdout.write(chunk);
    },
    endStream() {
      pauseSpinner();
      stdout.write("\n");
    },
    startSpinner(message: string) {
      pauseSpinner();
      spinnerMessage = message;
      spinnerFrameIndex = 0;

      if (!stdout.isTTY) {
        stdout.write(`${message}...\n`);
        return;
      }

      spinnerTimer = setInterval(renderSpinner, 80);
      renderSpinner();
    },
    stopSpinner() {
      pauseSpinner();
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
