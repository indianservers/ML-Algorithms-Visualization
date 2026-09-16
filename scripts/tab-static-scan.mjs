// Temporary diagnostic: find pages whose tab state is only ever read inside a
// className expression, i.e. the tab highlight moves but nothing is rendered.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory()
      ? walk(full)
      : full.endsWith(".tsx")
        ? [full]
        : [];
  });

for (const file of walk("src/pages")) {
  const src = readFileSync(file, "utf8");
  const decl = src.match(
    /const \[(tab|activeTab|currentTab|view|section)\s*,\s*set\w+\]\s*=\s*(?:React\.)?useState/,
  );
  if (!decl) continue;
  const name = decl[1];
  const reads = [
    ...src.matchAll(new RegExp(`(?<![\\w$.])${name}(?![\\w$])`, "g")),
  ].map((m) => m.index);

  let onlyClassName = true;
  let readCount = 0;
  for (const index of reads) {
    const before = src.slice(Math.max(0, index - 400), index);
    if (/const \[$/.test(before) || /const \[\s*$/.test(before)) continue;
    readCount++;
    // Walk back to the nearest `className=` / `class=` / JSX-expression opener.
    const openBrace = before.lastIndexOf("{");
    const context = before.slice(Math.max(0, openBrace - 14), openBrace);
    if (!/className=$|class=$/.test(context)) onlyClassName = false;
  }
  if (onlyClassName)
    console.log(`${file}  [${name}] read ${readCount}x, className-only`);
}
