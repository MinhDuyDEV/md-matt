---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Load and follow `/skill:tdd` where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, load and follow `/skill:code-review` to review the work.

Show the user the final diff summary, verification results, and review findings. Ask for explicit approval before committing. Commit to the current branch only after they approve; otherwise leave the verified changes uncommitted.
