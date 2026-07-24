import { assert, readText, success } from "./lib.mjs";

const text = await readText("src/data/book-one.ts");
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

success(
  "No embedded modern-translation markers found; external corpus comparison remains a manual blocker",
);
