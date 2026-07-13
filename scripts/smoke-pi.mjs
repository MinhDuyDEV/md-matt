#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "md-matt-smoke-"));
const configDir = path.join(tempRoot, "config");
const cwd = path.join(tempRoot, "workspace");
const probeFile = path.join(tempRoot, "probe.mjs");
const probeOutput = path.join(tempRoot, "resources.json");
fs.mkdirSync(configDir);
fs.mkdirSync(cwd);

const localPi = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "pi.cmd" : "pi");
const pi = process.env.PI_BIN || (fs.existsSync(localPi) ? localPi : "pi");
const env = {
  ...process.env,
  PI_CODING_AGENT_DIR: configDir,
  PI_OFFLINE: "1",
};

function run(args, options = {}) {
  const result = spawnSync(pi, args, {
    cwd,
    env: { ...env, ...(options.env ?? {}) },
    input: options.input,
    encoding: "utf8",
    timeout: 60_000,
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`pi ${args.join(" ")} failed (${result.status})\n${result.stderr}\n${result.stdout}`);
  }
  return result.stdout;
}

try {
  run(["install", root]);

  fs.writeFileSync(
    probeFile,
    `import fs from "node:fs";\n` +
      `export default function (pi) {\n` +
      `  pi.on("resources_discover", () => {\n` +
      `    fs.writeFileSync(process.env.MD_MATT_PROBE, JSON.stringify({\n` +
      `      tools: pi.getAllTools().map((tool) => ({ name: tool.name, sourceInfo: tool.sourceInfo, promptGuidelines: tool.promptGuidelines })),\n` +
      `      commands: pi.getCommands().map((command) => ({ name: command.name, source: command.source, sourceInfo: command.sourceInfo, description: command.description })),\n` +
      `    }));\n` +
      `  });\n` +
      `}\n`,
  );

  const rpcOutput = run(["-e", probeFile, "--mode", "rpc", "--no-session"], {
    env: { MD_MATT_PROBE: probeOutput },
    input: `${JSON.stringify({ id: "commands", type: "get_commands" })}\n`,
  });

  const events = rpcOutput
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const response = events.find((event) => event.type === "response" && event.id === "commands");
  if (!response?.success) throw new Error(`get_commands failed: ${JSON.stringify(response)}`);

  const resources = JSON.parse(fs.readFileSync(probeOutput, "utf8"));
  const packageSkills = response.data.commands.filter(
    (command) => command.source === "skill" && command.sourceInfo?.baseDir === root,
  );
  const subagent = resources.tools.find(
    (tool) => tool.name === "subagent" && tool.sourceInfo?.path === path.join(root, "extensions", "subagent", "index.ts"),
  );

  if (packageSkills.length !== 22) throw new Error(`expected 22 discovered package skills, found ${packageSkills.length}`);
  if (!subagent) throw new Error("subagent tool was not registered from md-matt");
  if (!subagent.promptGuidelines?.some((guideline) => guideline.includes("prefer task for long-running"))) {
    throw new Error("subagent prompt guidelines do not expose the optional task routing boundary");
  }

  console.log("Pi smoke test passed: 22 skills and the guarded subagent tool were discovered in an isolated config.");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
