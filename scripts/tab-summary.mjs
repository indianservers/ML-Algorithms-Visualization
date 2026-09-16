// Temporary diagnostic: roll the per-batch tab-audit logs into one verdict list.
//
//   node scripts/tab-summary.mjs .audit-0.txt .audit-1.txt ...

import { readFileSync } from "node:fs";

const LESSON =
  /^[^A-Za-z]*(Learn|Visualize|Dataset|Transform|Train|Build \/ Train|Metrics|Compare|Explain)$/;

const routes = [];
for (const file of process.argv.slice(2)) {
  let current = null;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const head = /^=== (\S+) ===$/.exec(line);
    if (head) {
      current = { route: head[1], bars: [], errors: [] };
      routes.push(current);
      continue;
    }
    if (!current) continue;
    const bar = /^ {2}bar#\d+ \[(.+)\]$/.exec(line);
    if (bar) {
      current.bars.push({ labels: bar[1].split(" | ") });
      continue;
    }
    const stat = /indicator=(\w+) layouts=(\d+)\/(\d+)/.exec(line);
    if (stat && current.bars.length) {
      Object.assign(current.bars.at(-1), {
        indicator: stat[1],
        layouts: Number(stat[2]),
        tabs: Number(stat[3]),
      });
      continue;
    }
    if (/^ {2}\[(pageerror|console)\]/.test(line))
      current.errors.push(line.trim());
  }
}

const verdicts = [];
for (const entry of routes) {
  const bar = entry.bars.find(
    (b) => b.labels.length >= 3 && b.labels.every((l) => LESSON.test(l)),
  );
  if (!bar) continue;
  verdicts.push({
    route: entry.route,
    tabs: bar.tabs,
    layouts: bar.layouts,
    indicator: bar.indicator,
    status:
      bar.indicator !== "ok" ? "INDICATOR" : bar.layouts <= 1 ? "BROKEN" : "ok",
    errors: entry.errors.length,
  });
}

verdicts.sort((a, b) => a.route.localeCompare(b.route));
for (const v of verdicts)
  console.log(
    `${v.status.padEnd(9)} ${v.route}  tabs=${v.tabs} layouts=${v.layouts}${v.errors ? " errors=" + v.errors : ""}`,
  );
console.log(
  `\nlesson tab strips: ${verdicts.length}  broken: ${verdicts.filter((v) => v.status !== "ok").length}  routes scanned: ${routes.length}`,
);
