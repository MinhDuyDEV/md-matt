#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npm, ["pack", "--dry-run", "--json"], {
  cwd: root,
  encoding: "utf8",
  shell: false,
  timeout: 60_000,
});

if (result.error) throw result.error;
if (result.status !== 0) {
  throw new Error(`npm pack --dry-run failed (${result.status})\n${result.stderr}\n${result.stdout}`);
}

const [pack] = JSON.parse(result.stdout);
const files = pack.files.map((file) => file.path);
const required = [
  "package.json",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "UPSTREAM.md",
  "THIRD_PARTY_NOTICES.md",
  "docs/README.md",
  "docs/architecture.vi.md",
  "docs/port-audit.vi.md",
  "extensions/aliases.ts",
  "extensions/subagent/index.ts",
  "extensions/subagent/agents.ts",
];
const missing = required.filter((file) => !files.includes(file));
const skillCount = files.filter((file) => file.endsWith("/SKILL.md")).length;
const nodeModules = files.filter((file) => file.startsWith("node_modules/"));
const snapshotDocs = files.filter(
  (file) => file.startsWith("docs/engineering/") || file.startsWith("docs/productivity/"),
);

const problems = [];
if (skillCount !== 39) problems.push(`expected 39 packaged SKILL.md files, found ${skillCount}`);
if (missing.length) problems.push(`missing required package files: ${missing.join(", ")}`);
if (nodeModules.length) problems.push(`node_modules leaked into package (${nodeModules.length} files)`);
if (snapshotDocs.length) problems.push(`upstream snapshot docs leaked into package (${snapshotDocs.length} files)`);

if (problems.length) {
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  `Package dry-run passed: ${files.length} files, ${skillCount} skills, ${pack.unpackedSize} unpacked bytes, no node_modules or snapshot docs.`,
);
