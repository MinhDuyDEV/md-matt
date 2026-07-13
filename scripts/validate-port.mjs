#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const note = (message) => console.log(`✓ ${message}`);
const fail = (message) => errors.push(message);
const rel = (file) => path.relative(root, file).split(path.sep).join("/");

function walk(dir, predicate = () => true) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(file, predicate));
    else if (entry.isFile() && predicate(file)) output.push(file);
  }
  return output;
}

function parseFrontmatter(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    fail(`${rel(file)} has no YAML frontmatter`);
    return { fields: new Map(), text };
  }

  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    // Capture every unindented YAML key, including malformed/uppercase keys,
    // so the active-field allowlist cannot be bypassed accidentally. Nested
    // metadata keys are indented and intentionally ignored here.
    const field = line.match(/^([^ \t#][^:]*):(?:\s*(.*))?$/);
    if (!field) continue;
    const key = field[1].trim();
    let value = (field[2] ?? "").trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fields.set(key, value);
  }
  return { fields, text };
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${rel(file)} is not valid JSON: ${error.message}`);
    return {};
  }
}

const packageJson = readJson(path.join(root, "package.json"));
const pluginJson = readJson(path.join(root, ".claude-plugin", "plugin.json"));
const allSkillFiles = walk(path.join(root, "skills"), (file) => path.basename(file) === "SKILL.md").sort();

if (allSkillFiles.length !== 39) fail(`expected 39 upstream SKILL.md files, found ${allSkillFiles.length}`);
else note("upstream inventory contains 39 skills");

const expectedBucketCounts = new Map([
  ["engineering", 17],
  ["productivity", 5],
  ["misc", 4],
  ["personal", 2],
  ["in-progress", 7],
  ["deprecated", 4],
]);
for (const [bucket, expected] of expectedBucketCounts) {
  const actual = allSkillFiles.filter((file) => rel(file).startsWith(`skills/${bucket}/`)).length;
  if (actual !== expected) fail(`skills/${bucket} expected ${expected} skills, found ${actual}`);
}

const activePaths = packageJson.pi?.skills ?? [];
const pluginPaths = pluginJson.skills ?? [];
if (packageJson.name !== "md-matt") fail(`package name must be md-matt, found ${packageJson.name ?? "missing"}`);
if (activePaths.length !== 22) fail(`pi.skills must expose exactly 22 directories, found ${activePaths.length}`);
if (new Set(activePaths).size !== activePaths.length) fail("pi.skills contains duplicate paths");
if (JSON.stringify([...activePaths].sort()) !== JSON.stringify([...pluginPaths].sort())) {
  fail("package.json pi.skills does not exactly mirror .claude-plugin/plugin.json");
} else {
  note("Pi manifest exposes the same 22 promoted skills as upstream");
}

const allowedFrontmatter = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
  "disable-model-invocation",
]);
const userInvoked = new Set([
  "ask-matt",
  "grill-with-docs",
  "triage",
  "improve-codebase-architecture",
  "setup-matt-pocock-skills",
  "to-spec",
  "to-tickets",
  "wayfinder",
  "implement",
  "grill-me",
  "handoff",
  "teach",
  "writing-great-skills",
]);

const activeSkills = new Map();
const activeMarkdown = [];
for (const manifestPath of activePaths) {
  const directory = path.resolve(root, manifestPath);
  const skillFile = path.join(directory, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    fail(`${manifestPath} does not contain SKILL.md`);
    continue;
  }

  const { fields } = parseFrontmatter(skillFile);
  const name = fields.get("name") ?? "";
  const description = fields.get("description") ?? "";
  const compatibility = fields.get("compatibility") ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    fail(`${rel(skillFile)} has invalid name: ${JSON.stringify(name)}`);
  }
  if (name !== path.basename(directory)) fail(`${rel(skillFile)} name does not match its directory`);
  if (!description || description.length > 1024 || description === "|" || description === ">") {
    fail(`${rel(skillFile)} description must be a single-line value of 1-1024 characters`);
  }
  if (compatibility.length > 500 || compatibility === "|" || compatibility === ">") {
    fail(`${rel(skillFile)} compatibility must be a single-line value of at most 500 characters`);
  }
  for (const key of fields.keys()) {
    if (!allowedFrontmatter.has(key)) fail(`${rel(skillFile)} has unsupported active frontmatter field: ${key}`);
  }

  const disabled = fields.get("disable-model-invocation") === "true";
  if (userInvoked.has(name) !== disabled) {
    fail(`${rel(skillFile)} invocation policy mismatch (expected disable-model-invocation=${userInvoked.has(name)})`);
  }
  if (activeSkills.has(name)) fail(`duplicate active skill name: ${name}`);
  activeSkills.set(name, { directory, skillFile, disabled });
  activeMarkdown.push(...walk(directory, (file) => file.endsWith(".md")));
}
if (activeSkills.size === 22) note("all 22 active skills have valid Pi-aware frontmatter and invocation policy");

function stripFencedCode(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}

for (const file of activeMarkdown) {
  const text = stripFencedCode(fs.readFileSync(file, "utf8"));
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().replace(/^<|>$/g, "");
    if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
    target = target.split("#")[0].split("?")[0];
    try {
      target = decodeURIComponent(target);
    } catch {
      // Keep the literal path and let the existence check report it.
    }
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) fail(`${rel(file)} has broken relative link: ${match[1]}`);
  }

  for (const match of text.matchAll(/\/skill:([a-z0-9-]+)/g)) {
    if (!activeSkills.has(match[1])) fail(`${rel(file)} references unloaded skill /skill:${match[1]}`);
  }

  const legacy = text.match(/\b(?:subagent_type|general-purpose)\b|\b(?:Agent|Task) tool\b/i);
  if (legacy) fail(`${rel(file)} still contains legacy harness instruction: ${legacy[0]}`);
}
note("active skill links, dependencies, and harness instructions are internally consistent");

const extensionPaths = packageJson.pi?.extensions ?? [];
const expectedExtensions = ["./extensions/aliases.ts", "./extensions/subagent/index.ts"];
if (JSON.stringify(extensionPaths) !== JSON.stringify(expectedExtensions)) {
  fail(`pi.extensions must be ${JSON.stringify(expectedExtensions)}`);
}
for (const extension of extensionPaths) {
  if (!fs.existsSync(path.resolve(root, extension))) fail(`missing extension: ${extension}`);
}

const subagentText = fs.readFileSync(path.join(root, "extensions", "subagent", "index.ts"), "utf8");
let optionalRoutingValid = true;
const failOptionalRouting = (message) => {
  optionalRoutingValid = false;
  fail(message);
};
if (subagentText.includes("confirmProjectAgents")) fail("subagent must not expose a model-controlled confirmation bypass");
if (!subagentText.includes("project-local agents require interactive confirmation")) {
  fail("subagent must refuse project agents when interactive confirmation is unavailable");
}
const routingGuidance = [
  "Use subagent for short, structured, blocking delegation",
  "When a separate task tool is available, prefer task for long-running, background, Herdr-observable, or resumable work",
  "never launch the same work through both tools",
];
for (const guidance of routingGuidance) {
  if (!subagentText.includes(guidance)) failOptionalRouting(`subagent routing guidance is missing: ${guidance}`);
}

const aliasesText = fs.existsSync(path.join(root, "extensions", "aliases.ts"))
  ? fs.readFileSync(path.join(root, "extensions", "aliases.ts"), "utf8")
  : "";
const aliases = [...aliasesText.matchAll(/^\s*\["([a-z0-9-]+)",/gm)].map((match) => match[1]);
if (aliases.length !== 22 || new Set(aliases).size !== 22) fail(`aliases.ts must define 22 unique aliases, found ${aliases.length}`);
if (!aliasesText.includes('pi.on("input"')) fail("aliases.ts must implement aliases through Pi's input event");
if (aliasesText.includes("registerCommand(")) fail("aliases.ts must not shadow commands by registering 22 bare commands");
if (!aliasesText.includes("action: \"transform\"") || !aliasesText.includes("/skill:${name}")) {
  fail("aliases.ts must transform bare input to the canonical /skill:<name> command");
}
if (JSON.stringify([...aliases].sort()) !== JSON.stringify([...activeSkills.keys()].sort())) {
  fail("alias catalog does not exactly match active skill names");
} else {
  note("safe slash-alias catalog covers all 22 active skills");
}

const agentDir = path.join(root, "extensions", "subagent", "agents");
const agentFiles = fs.existsSync(agentDir) ? walk(agentDir, (file) => file.endsWith(".md")) : [];
const expectedAgents = ["explorer", "planner", "researcher", "reviewer", "worker"];
const agentNames = agentFiles.map((file) => parseFrontmatter(file).fields.get("name") ?? "").sort();
if (JSON.stringify(agentNames) !== JSON.stringify(expectedAgents)) {
  fail(`bundled agent catalog mismatch: expected ${expectedAgents.join(", ")}; found ${agentNames.join(", ")}`);
} else {
  note("subagent runtime bundles five portable agents");
}

const peerNames = [
  "@earendil-works/pi-agent-core",
  "@earendil-works/pi-ai",
  "@earendil-works/pi-coding-agent",
  "@earendil-works/pi-tui",
  "typebox",
];
for (const peer of peerNames) {
  if (packageJson.peerDependencies?.[peer] !== "*") fail(`peerDependencies.${peer} must be "*"`);
}
if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
  fail("Pi core imports must not be bundled as runtime dependencies");
}
if (packageJson.bundledDependencies) fail("bundledDependencies must not be set for Pi core packages");

const optionalRuntimePackages = ["@heyhuynhgiabuu/pi-task", "pi-herdr-subagents"];
for (const packageName of optionalRuntimePackages) {
  for (const section of ["dependencies", "optionalDependencies", "peerDependencies", "bundledDependencies"]) {
    const entries = packageJson[section];
    if (Array.isArray(entries) ? entries.includes(packageName) : entries?.[packageName]) {
      failOptionalRouting(`${packageName} must remain an external optional integration, not package.json#${section}`);
    }
  }
}
const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8").split(/\r?\n/);
for (const artifactPath of [".pi/artifacts/", ".pi/task-registry.json", ".pi/task-session-history.json"]) {
  if (!gitignore.includes(artifactPath)) {
    failOptionalRouting(`.gitignore must exclude optional task runtime artifact: ${artifactPath}`);
  }
}
const readmeText = fs.readFileSync(path.join(root, "README.md"), "utf8");
const architectureText = fs.readFileSync(path.join(root, "docs", "architecture.vi.md"), "utf8");
if (!readmeText.includes("## Herdr và `pi-task` (tùy chọn)")) {
  failOptionalRouting("README must document optional Herdr/pi-task routing");
}
if (!architectureText.includes("### Routing tùy chọn với Herdr và `pi-task`")) {
  failOptionalRouting("architecture docs must define the optional Herdr/pi-task boundary");
}
if (optionalRoutingValid) note("optional Herdr task routing stays external, explicit, and artifact-safe");

const auditFile = path.join(root, "docs", "port-audit.vi.md");
if (!fs.existsSync(auditFile)) {
  fail("missing docs/port-audit.vi.md");
} else {
  const audit = fs.readFileSync(auditFile, "utf8");
  for (const skillFile of allSkillFiles) {
    const name = parseFrontmatter(skillFile).fields.get("name");
    if (name && !audit.includes(`\`${name}\``)) fail(`port audit omits skill: ${name}`);
  }
  note("Vietnamese port audit names all 39 upstream skills");
}

if (errors.length > 0) {
  console.error(`\nPort validation failed with ${errors.length} problem(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("\nmd-matt port validation passed.");
