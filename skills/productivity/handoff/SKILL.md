---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
disable-model-invocation: true
compatibility: Requires permission to create a private Markdown file in the operating system's temporary directory.
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

1. Resolve the OS temporary directory without writing to the workspace: prefer `$TMPDIR`, then `/tmp` on Unix; use `%TEMP%` on Windows. Create a unique `md-matt-handoff-<timestamp>.md` file with user-only permissions where the OS supports them.
2. Include a `Suggested skills` section naming relevant canonical `/skill:<name>` commands.
3. Do not duplicate content already captured in specs, plans, ADRs, issues, commits, or diffs. Reference those artifacts by path or URL.
4. Before writing, scan the draft for secrets and sensitive data. Redact likely API tokens (`sk-`, `ghp_`, `github_pat_`, `AKIA`, `xoxb-`, `xoxp-`), private-key blocks, passwords, session cookies, and personally identifiable information to `[REDACTED]`. Never read unrelated files merely to enrich the handoff.
5. Write the file, verify that it exists, and print its absolute path as the final line of the response.

If the user passed arguments, treat them as the next session's focus and tailor the handoff accordingly.
