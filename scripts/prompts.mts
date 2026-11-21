import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../src/lib/analysis/prompts/", import.meta.url);
type Registry = Record<
  string,
  { active: string; versions: Record<string, { file: string; sha256: string }> }
>;
export function compilePrompts() {
  const registry: Registry = JSON.parse(
    readFileSync(new URL("registry.json", root), "utf8"),
  );
  const resolve = (
    id: string,
    version: string,
    ancestors: string[] = [],
  ): string => {
    const key = `${id}@${version}`;
    if (ancestors.includes(key))
      throw new Error(`Prompt include cycle: ${key}`);
    const record = registry[id]?.versions[version];
    if (!record || record.file.includes(".."))
      throw new Error(`Unregistered prompt: ${key}`);
    const text = readFileSync(new URL(record.file, root), "utf8");
    if (createHash("sha256").update(text).digest("hex") !== record.sha256)
      throw new Error(`Prompt hash mismatch: ${key}`);
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) throw new Error(`Missing prompt metadata: ${key}`);
    const meta = JSON.parse(match[1]);
    if (
      meta.id !== id ||
      meta.version !== version ||
      !Array.isArray(meta.includes) ||
      !["draft", "active", "deprecated"].includes(meta.status) ||
      !("output_schema" in meta) ||
      !("model_notes" in meta) ||
      !("changed_from" in meta)
    )
      throw new Error(`Invalid prompt metadata: ${key}`);
    const used: string[] = [];
    const body = match[2]
      .trim()
      .replace(/\{\{include ([a-z-]+)@(v\d+)\}\}/g, (_, child, revision) => {
        const include = `${child}@${revision}`;
        if (!meta.includes.includes(include))
          throw new Error(`Unpinned include: ${include}`);
        used.push(include);
        return resolve(child, revision, [...ancestors, key]);
      });
    if (meta.includes.some((include: string) => !used.includes(include)))
      throw new Error(`Unused include in ${key}`);
    if (body.includes("{{include"))
      throw new Error(`Unresolved include in ${key}`);
    if (
      ["highlights", "json-repair"].includes(id) &&
      meta.output_schema !== "highlights-result@1"
    )
      throw new Error(`Unsupported output schema in ${key}`);
    return body;
  };
  // Verify historical files too, not only the currently selected version.
  for (const [id, entry] of Object.entries(registry))
    for (const version of Object.keys(entry.versions)) resolve(id, version);
  return Object.fromEntries(
    ["highlights", "json-repair"].map((id) => [
      id,
      {
        id,
        version: registry[id].active,
        schema: "highlights-result@1",
        text: resolve(id, registry[id].active),
      },
    ]),
  );
}

export function verifyPromptHistory(base: string) {
  const path = "src/lib/analysis/prompts/registry.json";
  // A missing Git ref is an error; a registry absent from that revision is a first release.
  execFileSync("git", ["rev-parse", "--verify", `${base}^{commit}`], {
    stdio: "pipe",
  });
  const files = execFileSync("git", ["ls-tree", "--name-only", base, path], {
    encoding: "utf8",
  }).trim();
  if (!files) return;
  const prior: Registry = JSON.parse(
    execFileSync("git", ["show", `${base}:${path}`], { encoding: "utf8" }),
  );
  const current: Registry = JSON.parse(
    readFileSync(new URL("registry.json", root), "utf8"),
  );
  for (const [id, entry] of Object.entries(prior))
    for (const [version, record] of Object.entries(entry.versions)) {
      if (
        JSON.stringify(current[id]?.versions[version]) !==
        JSON.stringify(record)
      )
        throw new Error(
          `Released prompt changed: ${id}@${version}. Add a new version instead.`,
        );
    }
}

export function checkPromptBundle() {
  const output = `${JSON.stringify(compilePrompts(), null, 2)}\n`;
  if (readFileSync(new URL("compiled.json", root), "utf8") !== output)
    throw new Error("Prompt bundle is stale. Run npm run prompts:generate.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--write"))
    writeFileSync(
      new URL("compiled.json", root),
      `${JSON.stringify(compilePrompts(), null, 2)}\n`,
    );
  else checkPromptBundle();
  const baseIndex = process.argv.indexOf("--base");
  if (baseIndex >= 0) verifyPromptHistory(process.argv[baseIndex + 1]);
}
