import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const aliases = [
  ["ask-matt", "Choose the Matt Pocock workflow that fits the current situation"],
  ["diagnosing-bugs", "Run the disciplined bug diagnosis loop"],
  ["grill-with-docs", "Interview deeply while maintaining domain documentation"],
  ["triage", "Triage issues and external pull requests"],
  ["improve-codebase-architecture", "Find and explore module-deepening opportunities"],
  ["setup-matt-pocock-skills", "Configure issue tracking and domain docs for these skills"],
  ["tdd", "Develop one red-green-refactor slice at a time"],
  ["to-spec", "Turn the current conversation into a specification"],
  ["to-tickets", "Split a specification into blocked tracer-bullet tickets"],
  ["wayfinder", "Map a multi-session effort as decision tickets"],
  ["implement", "Implement a specification or ticket set"],
  ["prototype", "Build a throwaway logic or UI prototype"],
  ["research", "Research a question against primary sources"],
  ["domain-modeling", "Sharpen domain language and decisions"],
  ["codebase-design", "Design deep modules and clean seams"],
  ["code-review", "Review a diff against standards and specification"],
  ["resolving-merge-conflicts", "Resolve an in-progress merge or rebase"],
  ["grill-me", "Stress-test a plan or decision through questions"],
  ["grilling", "Run the reusable one-question-at-a-time interview loop"],
  ["handoff", "Create a redacted cross-session handoff document"],
  ["teach", "Use the current directory as a stateful teaching workspace"],
  ["writing-great-skills", "Apply Matt Pocock's skill-writing vocabulary"],
] as const;

export default function registerSkillAliases(pi: ExtensionAPI) {
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const aliasNames = new Set<string>(aliases.map(([name]) => name));

  // Extension commands are resolved before input handlers. Prompt templates
  // are resolved afterwards, so check getCommands() at runtime and yield when
  // another resource already owns the bare name. Otherwise transform to Pi's
  // canonical skill command and let Pi perform its normal skill expansion.
  pi.on("input", (event) => {
    if (event.source === "extension") return { action: "continue" };

    const match = event.text.match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)([\s\S]*)$/);
    if (!match || !aliasNames.has(match[1])) return { action: "continue" };

    const name = match[1];
    const commands = pi.getCommands();
    if (commands.some((command) => command.name === name)) return { action: "continue" };

    const packageSkill = commands.find((command) => {
      if (command.name !== `skill:${name}`) return false;
      const relativePath = path.relative(packageRoot, command.sourceInfo.path);
      return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
    });
    if (!packageSkill) return { action: "continue" };

    return {
      action: "transform",
      text: `/skill:${name}${match[2]}`,
      images: event.images,
    };
  });
}
