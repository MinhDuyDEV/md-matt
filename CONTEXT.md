# md-matt

A Pi-native fork of Matt Pocock's agent skills. The repository retains all upstream sources while exposing the promoted engineering and productivity skills through a Pi package manifest.

## Language

**Promoted skill**:
A skill listed in both `.claude-plugin/plugin.json` and `package.json#pi.skills`. Pi loads exactly these 22 skills.
_Avoid_: active skill (ambiguous with model activation), installed skill

**Non-promoted skill**:
A skill retained under `misc/`, `personal/`, `in-progress/`, or `deprecated/` but excluded from the default Pi manifest.
_Avoid_: deleted skill, unavailable skill

**Input alias**:
A bare upstream command such as `/research` that `extensions/aliases.ts` transforms into Pi's canonical `/skill:research` only when no extension command or prompt template owns the bare name.
_Avoid_: alias command (it is an input transform, not a registered command)

**Package agent**:
A trusted agent definition bundled under `extensions/subagent/agents/`. Package agents are the baseline; user agents may override them and project agents require explicit scope and confirmation.
_Avoid_: built-in Pi agent, global agent

**Child Pi process**:
An isolated `pi --mode json --no-session` process spawned by the `subagent` tool for single, parallel, or chained work. It inherits the parent model and thinking level unless an agent definition overrides the model.
_Avoid_: background thread, built-in subagent

**Issue tracker**:
The system that stores a target repository's issues — GitHub Issues, GitLab Issues, a local `.scratch/` convention, or another workflow recorded by setup. Skills such as `to-tickets`, `to-spec`, `triage`, `code-review`, and `wayfinder` consume its generated configuration.
_Avoid_: backlog manager, backlog backend, issue host

**Issue**:
A tracked unit inside an **Issue tracker** — a bug, task, spec, or implementation slice.
_Avoid_: ticket, except for a **Decision ticket** or when quoting an external system

**Decision ticket**:
A `wayfinder` child **Issue** whose resolution is a decision rather than a build slice.

**Triage role**:
A canonical state-machine label applied to an **Issue** during triage. Each role maps to a real tracker label through `docs/agents/triage-labels.md` in the target repository.

## Relationships

- The repository contains 39 skills; the Pi manifest exposes 22 **Promoted skills**.
- An **Input alias** resolves to one **Promoted skill**.
- The `subagent` extension spawns a **Child Pi process** using a **Package agent**, user agent, or explicitly approved project agent.
- An **Issue tracker** holds **Issues**; an **Issue** carries one state **Triage role** at a time.
- A **Decision ticket** is an **Issue** and a child of a `wayfinder:map`.

## Flagged ambiguities

- “Alias” means an input transform in this fork, not a `registerCommand()` entry.
- “Subagent” names the package extension/tool; Pi core itself intentionally does not provide subagents.
- “Active” should describe runtime execution state, not promotion status. Use **Promoted skill** or **Non-promoted skill** for package membership.
