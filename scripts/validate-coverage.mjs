import { assert, readYaml, success } from "./lib.mjs";
import { previewBooks } from "../src/data/books-preview.mjs";

const books = [{ book: 1, lineCount: 444 }, ...previewBooks];
let total = 0;

for (const book of books) {
  const number = String(book.book).padStart(2, "0");
  const map = await readYaml(`src/data/line-map/book-${number}.yml`);
  let expected = 1;
  for (const segment of map) {
    const { start, end } = segment.source_range;
    assert(
      start === expected,
      `Book ${number}: gap or overlap before ${segment.paragraph_id}; expected ${expected}, got ${start}`,
    );
    assert(end >= start, `Book ${number}: invalid range ${start}-${end}`);
    expected = end + 1;
  }
  assert(
    expected === book.lineCount + 1,
    `Book ${number} must end at ${book.lineCount}; ended at ${expected - 1}`,
  );
  total += book.lineCount;
}

assert(total === 12110, `Expected 12,110 source lines, got ${total}`);
success("All 24 books cover 12,110 lines without structural gaps or overlaps");
