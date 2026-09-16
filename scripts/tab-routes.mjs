// Temporary diagnostic: map broken-tab page components to their routes.
import { readFileSync } from "node:fs";

const router = readFileSync("src/routes/router.tsx", "utf8");
const components = process.argv.slice(2);

for (const file of components) {
  const name = file.split(/[\\/]/).pop().replace(".tsx", "");
  const imported = new RegExp(
    `const (\\w+) = lazy\\(\\(\\) => import\\('[^']*${name}'\\)\\)`,
  ).exec(router);
  const local = imported?.[1] ?? name;
  const route = new RegExp(
    `path: '([^']+)', element: <${local} ?/>`,
  ).exec(router);
  console.log(`${route ? "/" + route[1] : "NO ROUTE"}\t${name}`);
}
