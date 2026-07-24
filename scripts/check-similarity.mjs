import { assert, readText, success } from "./lib.mjs";

const text = [
  await readText("src/data/book-one.ts"),
  await readText("src/data/book-two.ts"),
  await readText("src/data/book-three.ts"),
  await readText("src/data/book-four.ts"),
  await readText("src/data/book-five.ts"),
  await readText("src/data/book-six.ts"),
  await readText("src/data/book-seven.ts"),
  await readText("src/data/book-eight.ts"),
  await readText("src/data/book-nine.ts"),
  await readText("src/data/book-ten.ts"),
  await readText("src/data/book-eleven.ts"),
  await readText("src/data/book-twelve.ts"),
  await readText("src/data/book-thirteen.ts"),
  await readText("src/data/book-fourteen.ts"),
  await readText("src/data/book-fifteen.ts"),
  await readText("src/data/book-sixteen.ts"),
  await readText("src/data/book-seventeen.ts"),
  await readText("src/data/book-eighteen.ts"),
  await readText("src/data/book-nineteen.ts"),
  await readText("src/data/book-twenty.ts"),
  await readText("src/data/book-twenty-one.ts"),
  await readText("src/data/book-twenty-two.ts"),
  await readText("src/data/book-twenty-three.ts"),
  await readText("src/data/book-twenty-four.ts"),
  await readText("src/data/books-preview.mjs"),
].join("\n");
const suspiciousMarkers = [
  "перевод викентия вересаева",
  "перевод в. а. жуковского",
  "перевод павла шуйского",
  "copyrighted translation",
];
const normalized = text.toLocaleLowerCase("ru-RU");
for (const marker of suspiciousMarkers) {
  assert(
    !normalized.includes(marker),
    `Forbidden translation marker detected: ${marker}`,
  );
}

assert(
  !/[А-Яа-яЁё][A-Za-z]|[A-Za-z][А-Яа-яЁё]/u.test(text),
  "Mixed Cyrillic/Latin token detected in the published text",
);

success(
  "No embedded translation markers or mixed-script tokens found; external corpus comparison remains manual",
);
