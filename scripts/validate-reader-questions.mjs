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
let existingAnswerCount = 0;
let generatedAnswerCount = 0;

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
  const generatedAnswers = YAML.parse(
    await fs.readFile(
      new URL(`../src/data/reader-answers/book-${padded}.yml`, import.meta.url),
      "utf8",
    ),
  );
  const usedAnswerIds = new Set();

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
      const hasExistingAnswer = (book.notes ?? []).some(
        (note) =>
          note.anchor === passage.id &&
          normalize(note.title) === normalize(text),
      );
      const matchingGenerated = generatedAnswers.filter(
        (answer) =>
          answer.anchor === passage.id &&
          normalize(answer.question) === normalize(text),
      );
      if (Number(hasExistingAnswer) + matchingGenerated.length !== 1) {
        errors.push(
          `Book ${padded}, ${range}: question "${text}" needs exactly one public answer.`,
        );
      }
      if (hasExistingAnswer) existingAnswerCount += 1;
      if (matchingGenerated.length === 1) {
        const answer = matchingGenerated[0];
        generatedAnswerCount += 1;
        usedAnswerIds.add(answer.answer_id);
        if (
          !answer.answer_id ||
          answer.book !== bookNumber ||
          answer.line_start !== passage.lineStart ||
          answer.line_end !== passage.lineEnd ||
          answer.reveal_at_book !== bookNumber ||
          answer.reveal_at_line !== passage.lineEnd ||
          answer.requires_progress_book !== bookNumber ||
          answer.requires_progress_line !== passage.lineEnd ||
          answer.spoiler_level !== "safe"
        ) {
          errors.push(
            `Book ${padded}, ${range}: malformed generated answer for "${text}".`,
          );
        }
        if (
          String(answer.summary ?? "").trim().length < 60 ||
          String(answer.details ?? "").trim().length < 120
        ) {
          errors.push(
            `Book ${padded}, ${range}: generated answer for "${text}" is too shallow.`,
          );
        }
        if (
          answer.provenance !== "automated_passage_bound_editorial_synthesis" ||
          answer.human_reviewed !== false
        ) {
          errors.push(
            `Book ${padded}, ${range}: generated answer for "${text}" has misleading provenance.`,
          );
        }
        if (
          !Array.isArray(answer.source_ids) ||
          !answer.source_ids.includes("homer_odyssey_perseus_grc2") ||
          !answer.source_ids.includes("de_jong_2001")
        ) {
          errors.push(
            `Book ${padded}, ${range}: generated answer for "${text}" lacks core sources.`,
          );
        }
      }
    }
  }

  if (usedAnswerIds.size !== generatedAnswers.length) {
    errors.push(
      `Book ${padded}: ${generatedAnswers.length - usedAnswerIds.size} generated answers are orphaned.`,
    );
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `${questionCount} reader questions have linked explanations: ${existingAnswerCount} extended notes and ${generatedAnswerCount} passage-bound automated answers. Structural validation does not claim semantic quality.`,
);
