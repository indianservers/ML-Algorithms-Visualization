// Temporary diagnostic: every algorithm route registered in navigation.ts that
// the router actually serves.
import { readFileSync } from "node:fs";

const nav = readFileSync("src/data/navigation.ts", "utf8");
const router = readFileSync("src/routes/router.tsx", "utf8");

const navRoutes = [...nav.matchAll(/route:\s*'([^']+)'/g)].map((m) => m[1]);
const routerRoutes = new Set(
  [...router.matchAll(/path:\s*'([^']+)'/g)].map((m) => "/" + m[1]),
);

const served = navRoutes.filter((r) => routerRoutes.has(r));
const missing = navRoutes.filter((r) => !routerRoutes.has(r));

console.error(
  `nav=${navRoutes.length} served=${served.length} unrouted=${missing.length}`,
);
if (missing.length) console.error("unrouted: " + missing.join(" "));
console.log(served.join("\n"));
