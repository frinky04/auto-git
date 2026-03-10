# autogit

`autogit` is a small CLI for AI-assisted git workflows using OpenRouter.

## Commands

```bash
autogit commit [--model <id>] [--yes] [--all]
autogit push
autogit pr [--base <branch>] [--title <title>] [--body <body>]
autogit branch-commit <branch> [--model <id>] [--yes] [--all]
```

`autogit commit` now prompts to stage all changes when the working tree is dirty but nothing is staged. Use `--all` to skip that prompt and stage everything immediately.

## Configuration

Required:

- `OPENROUTER_API_KEY`

Optional environment variables:

- `AUTOGIT_MODEL`
- `OPENROUTER_BASE_URL`
- `AUTOGIT_SYSTEM_PROMPT`
- `AUTOGIT_DEFAULT_BASE_BRANCH`
- `AUTOGIT_CONFIG`

Optional config file locations:

- `./autogit.config.json`
- `~/.config/autogit/config.json`

Example config:

```json
{
  "model": "minimax/minimax-m2.5",
  "defaultBaseBranch": "main"
}
```

## Local usage

```bash
npm test
node ./bin/autogit.js commit
```
