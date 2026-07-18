import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, "src/types/database.ts");

const projectId = process.argv[2] ?? process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error(
    [
      "Missing Supabase project ID.",
      "Usage:",
      "  pnpm db:types <project-id>",
      "  SUPABASE_PROJECT_ID=<project-id> pnpm db:types",
    ].join("\n"),
  );
  process.exit(1);
}

const supabaseBin = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.CMD" : "supabase",
);

const result = spawnSync(
  supabaseBin,
  [
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectId,
    "--schema",
    "public",
  ],
  {
    cwd: projectRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  },
);

if (result.status !== 0) {
  const details = (result.stderr || result.stdout || "").trim();
  console.error(details || "Failed to generate Supabase types.");
  process.exit(result.status ?? 1);
}

const generated = result.stdout;
if (!generated.trim()) {
  console.error("Supabase CLI returned empty type output.");
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, generated, "utf8");
console.log(`Wrote ${outputPath}`);
