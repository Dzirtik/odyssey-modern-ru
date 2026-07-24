import { assert, success } from "./lib.mjs";
import { bookOne } from "../src/data/book-one.ts";
import { bookTwo } from "../src/data/book-two.ts";
import { bookThree } from "../src/data/book-three.ts";
import { bookFour } from "../src/data/book-four.ts";
import { bookFive } from "../src/data/book-five.ts";
import { bookSix } from "../src/data/book-six.ts";
import { bookSeven } from "../src/data/book-seven.ts";
import { bookEight } from "../src/data/book-eight.ts";
import { bookNine } from "../src/data/book-nine.ts";
import { bookTen } from "../src/data/book-ten.ts";
import { bookEleven } from "../src/data/book-eleven.ts";
import { bookTwelve } from "../src/data/book-twelve.ts";
import { bookThirteen } from "../src/data/book-thirteen.ts";
import { bookFourteen } from "../src/data/book-fourteen.ts";
import { bookFifteen } from "../src/data/book-fifteen.ts";
import { bookSixteen } from "../src/data/book-sixteen.ts";
import { bookSeventeen } from "../src/data/book-seventeen.ts";
import { bookEighteen } from "../src/data/book-eighteen.ts";
import { bookNineteen } from "../src/data/book-nineteen.ts";
import { bookTwenty } from "../src/data/book-twenty.ts";
import { bookTwentyOne } from "../src/data/book-twenty-one.ts";
import { bookTwentyTwo } from "../src/data/book-twenty-two.ts";
import { bookTwentyThree } from "../src/data/book-twenty-three.ts";
import { bookTwentyFour } from "../src/data/book-twenty-four.ts";
import { previewBooks } from "../src/data/books-preview.mjs";

const books = [
  bookOne,
  bookTwo,
  bookThree,
  bookFour,
  bookFive,
  bookSix,
  bookSeven,
  bookEight,
  bookNine,
  bookTen,
  bookEleven,
  bookTwelve,
  bookThirteen,
  bookFourteen,
  bookFifteen,
  bookSixteen,
  bookSeventeen,
  bookEighteen,
  bookNineteen,
  bookTwenty,
  bookTwentyOne,
  bookTwentyTwo,
  bookTwentyThree,
  bookTwentyFour,
  ...previewBooks,
];
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
      words / sourceLines >= 2.5,
      `Book ${book.book}: ${book.status} is too compressed (${(words / sourceLines).toFixed(2)} Russian words per source line; minimum 2.5 for source-aligned prose)`,
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
