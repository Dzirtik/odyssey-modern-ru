import { assert, readText, success } from "./lib.mjs";

const text = [
  await readText("src/data/book-one.ts"),
  await readText("src/data/book-two.ts"),
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
