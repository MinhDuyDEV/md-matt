---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to an isolated child agent.
compatibility: Requires the md-matt Pi package's subagent extension and network access when sources are not local.
---

Delegate the reading legwork to the bundled `subagent` tool in single mode:

```json
{
  "agent": "researcher",
  "task": "Investigate <question> against primary sources. Return cited findings; do not modify the repository."
}
```

Then:

1. Check that material claims in the returned report point to **primary sources** — official docs, source code, specs, or first-party APIs — rather than secondary write-ups. Separate verified facts from inference.
2. Write the verified findings to one Markdown file, citing each claim's source. The parent agent owns this write; the researcher is read-only.
3. Save it where the repo already keeps such notes. Match the existing convention; if there is none, choose a sensible documentation path and tell the user exactly where it was written.
4. Never send private repository content, credentials, or personal data to an external source while researching.
