import fs from "node:fs/promises";
import YAML from "yaml";

const numberWords = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty-one",
  "twenty-two",
  "twenty-three",
  "twenty-four",
];

const normalize = (value) =>
  value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/[«»“”„"'`]/g, "")
    .replace(/[?.!,:;—–-]+$/g, "")
    .replace(/\s+/g, " ");

const errors = [];
let questionCount = 0;
let answeredCount = 0;

for (let index = 0; index < numberWords.length; index += 1) {
  const bookNumber = index + 1;
  const padded = String(bookNumber).padStart(2, "0");
  const module = await import(`../src/data/book-${numberWords[index]}.ts`);
  const book = Object.values(module).find(
    (value) =>
      value &&
      typeof value === "object" &&
      value.book === bookNumber &&
      Array.isArray(value.passages),
  );
  const rawMap = await fs.readFile(
    new URL(`../editorial/semantic-map/book-${padded}.yml`, import.meta.url),
    "utf8",
  );
  const semanticMap = YAML.parse(rawMap);
  const segments = semanticMap.segments ?? [];

  if (segments.length !== book.passages.length) {
    errors.push(
      `Book ${padded}: ${segments.length} semantic segments for ${book.passages.length} passages.`,
    );
  }

  for (const passage of book.passages) {
    const range = `${passage.lineStart}-${passage.lineEnd}`;
    const matchingSegments = segments.filter(
      (segment) => String(segment.lines) === range,
    );
    if (matchingSegments.length !== 1) {
      errors.push(
        `Book ${padded}, ${range}: expected one semantic segment, found ${matchingSegments.length}.`,
      );
      continue;
    }

    const questions = matchingSegments[0].reader_questions ?? [];
    const normalized = questions.map((question) => normalize(String(question)));
    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
      errors.push(`Book ${padded}, ${range}: duplicate reader question.`);
    }

    for (const question of questions) {
      const text = String(question).trim();
      questionCount += 1;
      if (!text || !text.endsWith("?")) {
        errors.push(
          `Book ${padded}, ${range}: reader question must be non-empty and end with "?".`,
        );
      }
      const hasAnswer = (book.notes ?? []).some(
        (note) =>
          note.anchor === passage.id &&
          normalize(note.title) === normalize(text),
      );
      if (hasAnswer) answeredCount += 1;
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `${questionCount} reader questions validated across 24 books; ${answeredCount} link directly to sourced explanations.`,
);
