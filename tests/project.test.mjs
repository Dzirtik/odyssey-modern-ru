import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import YAML from "yaml";

test("Book I line map covers 1-444 exactly", async () => {
  const map = YAML.parse(
    await fs.readFile("src/data/line-map/book-01.yml", "utf8"),
  );
  const lines = map.flatMap(({ source_range }) =>
    Array.from(
      { length: source_range.end - source_range.start + 1 },
      (_, i) => source_range.start + i,
    ),
  );
  assert.deepEqual(
    lines,
    Array.from({ length: 444 }, (_, i) => i + 1),
  );
});

test("all 24 neutral book routes are generated", async () => {
  const page = await fs.readFile("src/pages/book/[book].astro", "utf8");
  assert.match(page, /length: 24/);
  assert.match(page, /Текст ещё не опубликован/);
});

test("human review is not claimed", async () => {
  const [content, log] = await Promise.all([
    fs.readFile("src/data/book-one.ts", "utf8"),
    fs.readFile("HUMAN_EDITORIAL_LOG.md", "utf8"),
  ]);
  assert.match(content, /humanReviewed: false/);
  assert.match(log, /не зафиксировано/);
});

test("core accessibility affordances exist", async () => {
  const [layout, css] = await Promise.all([
    fs.readFile("src/layouts/BaseLayout.astro", "utf8"),
    fs.readFile("src/styles/global.css", "utf8"),
  ]);
  assert.match(layout, /class="skip-link"/);
  assert.match(layout, /<main id="main">/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media print/);
});
