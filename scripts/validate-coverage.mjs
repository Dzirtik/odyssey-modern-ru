import { assert, readYaml, success } from "./lib.mjs";

const map = await readYaml("src/data/line-map/book-01.yml");
let expected = 1;

for (const segment of map) {
  const { start, end } = segment.source_range;
  assert(
    start === expected,
    `Coverage gap or overlap before ${segment.paragraph_id}: expected ${expected}, got ${start}`,
  );
  assert(end >= start, `Invalid range ${start}-${end}`);
  expected = end + 1;
}

assert(
  expected === 445,
  `Book I coverage must end at 444; ended at ${expected - 1}`,
);
success(
  "Book I lines 1-444 have continuous, non-overlapping structural coverage",
);
