import fs from "node:fs/promises";
import path from "node:path";
import { assert, success } from "./lib.mjs";

const distRoot = "dist";
const repository =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "odyssey-modern-ru";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = isGitHubPages ? `/${repository}` : "";
const canonicalPrefix = `https://dzirtik.github.io${basePath}/`;

const walk = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
};

const files = await walk(distRoot);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const indexableCanonicals = new Set();
const titles = new Set();
const descriptions = new Set();
const expectedLastModified = "2026-07-24";
let passageBoundAnswerCount = 0;

const matchOne = (html, pattern, label, file) => {
  const matches = [...html.matchAll(pattern)];
  assert(matches.length === 1, `${file}: expected one ${label}`);
  return matches[0][1];
};

for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  const isLongFormBook = /dist\/book\/\d{2}\/index\.html$/.test(file);
  // GitHub Pages prefixes internal URLs with the repository name, adding a few
  // kilobytes to the longest annotated books compared with a root-local build.
  const htmlBudget = isLongFormBook ? 210_000 : 100_000;
  assert(
    Buffer.byteLength(html) < htmlBudget,
    `${file}: HTML exceeds the ${htmlBudget / 1_000} KB SEO budget`,
  );
  const title = matchOne(html, /<title>([^<]+)<\/title>/g, "title", file);
  const description = matchOne(
    html,
    /<meta name="description" content="([^"]+)">/g,
    "meta description",
    file,
  );
  const canonical = matchOne(
    html,
    /<link rel="canonical" href="([^"]+)">/g,
    "canonical",
    file,
  );
  const robots = matchOne(
    html,
    /<meta name="robots" content="([^"]+)">/g,
    "robots policy",
    file,
  );
  const viewport = matchOne(
    html,
    /<meta name="viewport" content="([^"]+)">/g,
    "viewport policy",
    file,
  );
  assert(
    viewport.includes("width=device-width") &&
      viewport.includes("initial-scale=1"),
    `${file}: viewport must be mobile-friendly`,
  );
  assert(
    /<meta name="author" content="Dzirtik">/.test(html),
    `${file}: missing author metadata`,
  );
  assert(
    /<link rel="license" href="[^"]+\/rights\/">/.test(html),
    `${file}: missing license relationship`,
  );
  assert(
    /<meta property="og:image:type" content="image\/png">/.test(html) &&
      /<meta property="og:image:width" content="1200">/.test(html) &&
      /<meta property="og:image:height" content="630">/.test(html),
    `${file}: incomplete social image metadata`,
  );
  matchOne(
    html,
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    "JSON-LD block",
    file,
  );
  const jsonLd = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );
  assert(Array.isArray(jsonLd["@graph"]), `${file}: invalid JSON-LD graph`);
  const schemaTypes = jsonLd["@graph"].map((item) => item["@type"]);
  for (const requiredType of ["WebSite", "Person", "ImageObject", "Book"]) {
    assert(
      schemaTypes.includes(requiredType),
      `${file}: missing ${requiredType} schema`,
    );
  }
  assert(
    schemaTypes.some((type) =>
      ["WebPage", "CollectionPage", "AboutPage"].includes(type),
    ),
    `${file}: missing page-level schema`,
  );
  assert(
    !schemaTypes.some((type) =>
      ["Review", "AggregateRating", "FAQPage"].includes(type),
    ),
    `${file}: unsupported promotional schema type`,
  );
  const bookMatch = file.match(/dist\/book\/(\d{2})\/index\.html$/);
  if (bookMatch) {
    const chapter = jsonLd["@graph"].find(
      (item) => item["@type"] === "Chapter",
    );
    assert(chapter, `${file}: missing Chapter schema`);
    assert(
      chapter.position === Number(bookMatch[1]),
      `${file}: Chapter position does not match its route`,
    );
    assert(
      chapter.isPartOf?.["@id"]?.endsWith("#odyssey"),
      `${file}: Chapter must belong to the Odyssey work`,
    );
    assert(
      !html.includes('class="reader-questions"'),
      `${file}: duplicate reader-question index must not be rendered`,
    );
    passageBoundAnswerCount += (
      html.match(/<details class="note reader-answer"/g) ?? []
    ).length;
  }
  if (file.endsWith("/read/index.html")) {
    const itemList = jsonLd["@graph"].find(
      (item) => item["@type"] === "ItemList",
    );
    assert(
      itemList?.numberOfItems === 24 && itemList.itemListElement?.length === 24,
      `${file}: incomplete book ItemList`,
    );
  }
  assert(
    canonical.startsWith(canonicalPrefix),
    `${file}: canonical is outside ${canonicalPrefix}`,
  );
  assert(!canonical.includes("localhost"), `${file}: localhost canonical`);
  assert(!titles.has(title), `${file}: duplicate title`);
  assert(!descriptions.has(description), `${file}: duplicate description`);
  assert(
    title.length >= 20 && title.length <= 70,
    `${file}: title length ${title.length} is outside 20–70 characters`,
  );
  assert(
    description.length >= 60 && description.length <= 180,
    `${file}: description length ${description.length} is outside 60–180 characters`,
  );
  titles.add(title);
  descriptions.add(description);
  assert(
    (html.match(/<h1(?:\s|>)/g) ?? []).length === 1,
    `${file}: expected one h1`,
  );
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!href.startsWith("/")) continue;
    assert(
      href.startsWith(`${basePath}/`),
      `${file}: internal link loses the production base: ${href}`,
    );
    if (basePath) {
      assert(
        !href.includes(`${basePath}${basePath}/`),
        `${file}: internal link duplicates the production base: ${href}`,
      );
    }
  }

  const isNoindexRoute = file.endsWith("/404.html") || file === "dist/404.html";
  if (isNoindexRoute) {
    assert(robots.startsWith("noindex"), `${file}: page must be noindex`);
  } else {
    assert(robots.startsWith("index"), `${file}: page must be indexable`);
    indexableCanonicals.add(canonical);
    if (canonical !== canonicalPrefix) {
      const breadcrumb = jsonLd["@graph"].find(
        (item) => item["@type"] === "BreadcrumbList",
      );
      const visibleBreadcrumbs =
        html.match(/<nav class="breadcrumbs"[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? "";
      const visibleItems = visibleBreadcrumbs.match(/<li>/g) ?? [];
      assert(breadcrumb, `${file}: missing BreadcrumbList schema`);
      assert(
        visibleItems.length >= 2 &&
          visibleItems.length === breadcrumb.itemListElement?.length,
        `${file}: visible and structured breadcrumbs differ`,
      );
    }
  }
}

assert(
  passageBoundAnswerCount === 265,
  `Expected 265 passage-bound reader answers, found ${passageBoundAnswerCount}`,
);

for (const route of ["glossary", "people", "map"]) {
  const html = await fs.readFile(`dist/${route}/index.html`, "utf8");
  for (const [tag, reveal] of html.matchAll(
    /<[^>]+data-reveal-book="(\d+)"[^>]*>/g,
  )) {
    if (Number(reveal) <= 1) continue;
    assert(/\shidden(?:\s|>)/.test(tag), `${route}: future content is visible`);
    assert(
      tag.includes("data-nosnippet") || tag.includes("<article"),
      `${route}: future content may leak into snippets`,
    );
  }
  if (route === "people") {
    const futurePeople =
      html.match(
        /<article[^>]+data-reveal-book="(?:[2-9]|1\d|2[0-4])"[^>]*hidden/g,
      ) ?? [];
    assert(
      futurePeople.length > 0,
      "people: future entries must be hidden in initial HTML",
    );
    assert(
      futurePeople.every((tag) => tag.includes("data-nosnippet")),
      "people: future entries need data-nosnippet attributes",
    );
  }
}

const sitemapFiles = files.filter((file) => /sitemap-\d+\.xml$/.test(file));
assert(sitemapFiles.length > 0, "No sitemap content file generated");
const sitemapURLs = new Set();
let sitemapLastModifiedCount = 0;
for (const file of sitemapFiles) {
  const xml = await fs.readFile(file, "utf8");
  for (const [, url] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapURLs.add(url);
  }
  for (const [, lastmod] of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
    assert(
      lastmod.startsWith(expectedLastModified),
      `${file}: unreliable sitemap lastmod ${lastmod}`,
    );
    sitemapLastModifiedCount += 1;
  }
}

assert(
  sitemapURLs.size === 34,
  `Expected 34 sitemap URLs, found ${sitemapURLs.size}`,
);
assert(
  [...sitemapURLs].every((url) => url.startsWith(canonicalPrefix)),
  "Sitemap contains a URL outside the canonical base",
);
assert(
  [...indexableCanonicals].every((url) => sitemapURLs.has(url)),
  "An indexable canonical is missing from the sitemap",
);
assert(
  [...sitemapURLs].every((url) => indexableCanonicals.has(url)),
  "Sitemap contains a non-canonical or non-indexable URL",
);
assert(
  sitemapLastModifiedCount === sitemapURLs.size,
  "Every sitemap URL needs a reliable lastmod",
);

for (const file of files.filter((item) => item.endsWith(".css"))) {
  const stat = await fs.stat(file);
  assert(stat.size < 50_000, `${file}: CSS exceeds the 50 KB SEO budget`);
}

success(
  `SEO validated: ${indexableCanonicals.size} indexable pages, concise unique metadata, visible breadcrumbs, enriched JSON-LD, and dated sitemap coverage`,
);
