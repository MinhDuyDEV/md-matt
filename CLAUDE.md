# md-matt Pi port rules

This branch is a Pi-native fork of `mattpocock/skills`. The behavior contract is the 22 skill directories in `package.json#pi.skills`, their support files, and the bundled extensions. Keep that list exactly in sync with `.claude-plugin/plugin.json`; retain all 39 upstream skill sources, but do not expose non-promoted buckets by default.

New package, architecture, audit, and security documentation is written in Vietnamese. Skill instructions remain in English. `docs/engineering/` and `docs/productivity/` are retained as upstream snapshots for provenance; Pi-fork behavior belongs in `SKILL.md`, root `README.md`, and `docs/*.vi.md`.

Before claiming a change complete, run `npm test`, `npm run pack:check`, and `npm audit --audit-level=moderate`. Do not reintroduce `Agent tool`, `Task tool`, `subagent_type`, or model-pinned package agents into promoted skills.

Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used, not promoted
- `personal/` — tied to my own setup, not promoted
- `in-progress/` — drafts not yet ready to ship
- `deprecated/` — no longer used

Every skill in `engineering/` or `productivity/` (the **promoted** buckets) must have a reference in the top-level `README.md` and an entry in `.claude-plugin/plugin.json`. Skills in `misc/`, `personal/`, `in-progress/`, and `deprecated/` must not appear in either.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. The promoted buckets' `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**; non-promoted bucket `README.md`s (`misc/`, `personal/`) use a flat list.

Upstream keeps a human-facing page for each promoted skill at `docs/<bucket>/<skill-name>.md`. In this fork those pages are an upstream snapshot, not the Pi behavior contract and not part of the npm tarball. Preserve them for upstream sync. Document Pi-specific behavior changes in the skill itself and in the Vietnamese fork docs; re-sync an upstream page only when deliberately contributing the same behavior back upstream. Skills in non-promoted buckets continue to have no upstream docs page.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true` plus `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, reachable only by the human) or model-invoked (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md).

[`ask-matt`](./skills/engineering/ask-matt/SKILL.md) is the router that maps every user-reachable skill and how they relate. The same trigger that re-syncs a docs page applies to it: whenever you add, rename, remove, or change how a user-reachable skill fits the flows, re-read `ask-matt`'s `SKILL.md` and update it so the map stays accurate — a new skill it never mentions, or a stale one it still routes to, is a router that lies.

The upstream-only `scripts/link-skills.sh` still links skills into `~/.claude/skills` and `~/.agents/skills`. Pi users install this repository as a package (`pi install <path-or-git-url>`); do not add `~/.pi` mutation to the upstream link script.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `MinhDuyDEV/md-matt`. See `docs/agents/issue-tracker.md`.

### Triage labels

The tracker uses the five default triage roles plus `bug`, `enhancement`, and Wayfinder labels. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-doc layout. See `docs/agents/domain.md`.
