import { assert, readText, readYaml, success } from "./lib.mjs";

const sources = await readYaml("src/data/sources.yml");
for (const source of sources) new URL(source.url);

const routes = [
  "src/pages/index.astro",
  "src/pages/read/index.astro",
  "src/pages/book/[book].astro",
  "src/pages/people.astro",
  "src/pages/glossary.astro",
  "src/pages/map.astro",
  "src/pages/methodology.astro",
  "src/pages/sources.astro",
  "src/pages/rights.astro",
  "src/pages/ai-disclosure.astro",
  "src/pages/changelog.astro",
  "src/pages/404.astro",
];
for (const route of routes) {
  const text = await readText(route);
  assert(!text.includes('href="#"'), `Placeholder link in ${route}`);
}

success(
  `${sources.length} external source URLs parsed and required local routes inspected`,
);
