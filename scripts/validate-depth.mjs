import { assert, success } from "./lib.mjs";
import { bookOne } from "../src/data/book-one.ts";
import { previewBooks } from "../src/data/books-preview.mjs";

const books = [bookOne, ...previewBooks];
const allowedStatuses = new Set([
  "draft",
  "editorial_preview",
  "editorially_approved",
]);

for (const book of books) {
  const sourceLines = book.passages.reduce(
    (total, passage) => total + passage.lineEnd - passage.lineStart + 1,
    0,
  );
  const words = book.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ")
    .trim()
    .split(/\s+/u).length;
  const maxSpan = Math.max(
    ...book.passages.map((passage) => passage.lineEnd - passage.lineStart + 1),
  );

  assert(
    allowedStatuses.has(book.status),
    `Book ${book.book}: invalid status ${book.status}`,
  );
  assert(
    book.humanReviewed === false || book.status === "editorially_approved",
    `Book ${book.book}: human review cannot be claimed for an unapproved status`,
  );

  if (
    book.status === "editorial_preview" ||
    book.status === "editorially_approved"
  ) {
    assert(
      book.passages.length >= 12,
      `Book ${book.book}: ${book.status} requires at least 12 semantic segments`,
    );
    assert(
      maxSpan <= 40,
      `Book ${book.book}: ${book.status} has an unexplained ${maxSpan}-line segment`,
    );
    assert(
      words / sourceLines >= 4,
      `Book ${book.book}: ${book.status} is too compressed (${(words / sourceLines).toFixed(2)} Russian words per source line)`,
    );
    assert(
      book.notes.length >= 4,
      `Book ${book.book}: ${book.status} needs at least 4 newcomer notes or a documented exception`,
    );
  }
}

const drafts = books.filter((book) => book.status === "draft").length;
const previews = books.filter(
  (book) => book.status === "editorial_preview",
).length;
const approved = books.filter(
  (book) => book.status === "editorially_approved",
).length;

success(
  `Editorial depth gate: ${drafts} draft, ${previews} preview, ${approved} approved; compressed drafts cannot masquerade as previews`,
);
