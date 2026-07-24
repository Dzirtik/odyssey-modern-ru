import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import YAML from "yaml";
import { previewBooks } from "../src/data/books-preview.mjs";

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

test("all 24 book routes use the reader", async () => {
  const page = await fs.readFile("src/pages/book/[book].astro", "utf8");
  assert.match(page, /length: 24/);
  assert.match(page, /BookReader/);
  assert.equal(previewBooks.length, 23);
});

test("Books II-XXIV have continuous in-memory coverage", () => {
  for (const book of previewBooks) {
    let expected = 1;
    for (const passage of book.passages) {
      assert.equal(passage.lineStart, expected);
      expected = passage.lineEnd + 1;
    }
    assert.equal(expected, book.lineCount + 1);
  }
  assert.equal(
    444 + previewBooks.reduce((sum, book) => sum + book.lineCount, 0),
    12110,
  );
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
