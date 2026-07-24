import YAML from "yaml";
import { assert, readText, readYaml, success } from "./lib.mjs";
import { bookOne } from "../src/data/book-one.ts";
import { previewBooks } from "../src/data/books-preview.mjs";

const roles = [
  "philology",
  "history",
  "religion",
  "literary",
  "critical",
  "reader",
  "spoilers",
  "factcheck",
  "rights",
];
const sources = await readYaml("src/data/sources.yml");
const sourceIds = new Set(sources.map((source) => source.id));
const books = [bookOne, ...previewBooks];

for (const book of books) {
  const number = String(book.book).padStart(2, "0");
  const semanticMap = YAML.parse(
    await readText(`editorial/semantic-map/book-${number}.yml`),
  );
  const decisions = await readText(`editorial/decisions/book-${number}.md`);

  assert(
    semanticMap.status === book.status,
    `Book ${book.book}: semantic-map status differs from published status`,
  );
  assert(
    semanticMap.segments.length === book.passages.length,
    `Book ${book.book}: semantic map must match published segments`,
  );
  assert(
    decisions.includes(`\`${book.status}\``),
    `Book ${book.book}: decisions do not record ${book.status}`,
  );

  for (const note of book.notes) {
    assert(
      book.passages.some((passage) => passage.id === note.anchor),
      `Book ${book.book}: note ${note.id} has unknown anchor ${note.anchor}`,
    );
    for (const sourceId of note.sourceIds) {
      assert(
        sourceIds.has(sourceId),
        `Book ${book.book}: note ${note.id} cites unknown source ${sourceId}`,
      );
    }
  }

  for (const role of roles) {
    const report = await readText(
      `editorial/reviews/book-${number}/${role}.md`,
    );
    assert(
      report.length >= 350,
      `Book ${book.book}: ${role} report is too short to be auditable`,
    );

    if (book.status === "draft") {
      assert(
        report.includes("Роль ещё не выполнена"),
        `Book ${book.book}: draft ${role} checklist must not claim a completed role`,
      );
    } else {
      assert(
        !report.includes("Роль ещё не выполнена"),
        `Book ${book.book}: preview ${role} report is still a placeholder`,
      );
      assert(
        /\b1[.:\-–]\d+|\b1\.\d+–\d+/u.test(report),
        `Book ${book.book}: ${role} report lacks a line-specific reference`,
      );
      assert(
        /автоматизированн|не человеческ|человеческ/u.test(report),
        `Book ${book.book}: ${role} report must disclose review provenance`,
      );
    }
  }

  if (book.status === "editorial_preview") {
    assert(
      /\|\s*Роль\s*\|\s*Замечание\s*\|\s*Решение\s*\|\s*Состояние\s*\|/u.test(
        decisions,
      ),
      `Book ${book.book}: preview decisions need a traceable issue table`,
    );
    assert(
      decisions.includes(
        "До закрытия этих блокеров статус `editorially_approved` запрещён",
      ),
      `Book ${book.book}: preview decisions must preserve approval blockers`,
    );
  }
}

success(
  "Editorial artifacts are status-consistent, source-linked, and explicit about review provenance",
);
