import { assert, readYaml, success } from "./lib.mjs";
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
  { book: 1, lineCount: 444 },
  { book: 2, lineCount: bookTwo.lineCount },
  { book: 3, lineCount: bookThree.lineCount },
  { book: 4, lineCount: bookFour.lineCount },
  { book: 5, lineCount: bookFive.lineCount },
  { book: 6, lineCount: bookSix.lineCount },
  { book: 7, lineCount: bookSeven.lineCount },
  { book: 8, lineCount: bookEight.lineCount },
  { book: 9, lineCount: bookNine.lineCount },
  { book: 10, lineCount: bookTen.lineCount },
  { book: 11, lineCount: bookEleven.lineCount },
  { book: 12, lineCount: bookTwelve.lineCount },
  { book: 13, lineCount: bookThirteen.lineCount },
  { book: 14, lineCount: bookFourteen.lineCount },
  { book: 15, lineCount: bookFifteen.lineCount },
  { book: 16, lineCount: bookSixteen.lineCount },
  { book: 17, lineCount: bookSeventeen.lineCount },
  { book: 18, lineCount: bookEighteen.lineCount },
  { book: 19, lineCount: bookNineteen.lineCount },
  { book: 20, lineCount: bookTwenty.lineCount },
  { book: 21, lineCount: bookTwentyOne.lineCount },
  { book: 22, lineCount: bookTwentyTwo.lineCount },
  { book: 23, lineCount: bookTwentyThree.lineCount },
  { book: 24, lineCount: bookTwentyFour.lineCount },
  ...previewBooks,
];
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
success(
  "All 24 books have line-range continuity across 12,110 source lines; this structural check does not claim semantic completeness",
);
