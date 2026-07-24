import { assert, readYaml, success } from "./lib.mjs";

const facts = await readYaml("src/data/knowledge-state.yml");
const notes = [];
const readerAnswers = [];
for (let book = 1; book <= 24; book += 1) {
  const number = String(book).padStart(2, "0");
  notes.push(...(await readYaml(`src/data/notes/book-${number}.yml`)));
  readerAnswers.push(
    ...(await readYaml(`src/data/reader-answers/book-${number}.yml`)),
  );
}
const factMap = new Map(facts.map((fact) => [fact.fact_id, fact]));
const sourceIds = new Set(
  (await readYaml("src/data/sources.yml")).map((source) => source.id),
);

for (const note of notes) {
  for (const field of [
    "note_id",
    "reveal_at_book",
    "reveal_at_line",
    "requires_progress_book",
    "requires_progress_line",
    "spoiler_level",
    "fact_ids",
    "source_ids",
  ]) {
    assert(
      field in note,
      `Note ${note.note_id ?? "(missing id)"} lacks ${field}`,
    );
  }
  for (const factId of note.fact_ids) {
    const fact = factMap.get(factId);
    assert(fact, `Note ${note.note_id} cites unknown fact ${factId}`);
    const factMoment = fact.reveal_at.book * 10000 + fact.reveal_at.line;
    const requiredMoment =
      note.requires_progress_book * 10000 + note.requires_progress_line;
    assert(
      factMoment <= requiredMoment,
      `Spoiler: ${note.note_id} exposes ${factId} before reveal`,
    );
  }
  for (const sourceId of note.source_ids) {
    assert(
      sourceIds.has(sourceId),
      `Note ${note.note_id} cites unknown source ${sourceId}`,
    );
  }
}

for (const answer of readerAnswers) {
  assert(answer.answer_id, "Reader answer lacks answer_id");
  assert(
    answer.book >= 1 &&
      answer.book <= 24 &&
      answer.line_start >= 1 &&
      answer.line_end >= answer.line_start,
    `Reader answer ${answer.answer_id} has an invalid reveal range`,
  );
  assert(
    answer.reveal_at_book === answer.book &&
      answer.reveal_at_line === answer.line_end &&
      answer.requires_progress_book === answer.book &&
      answer.requires_progress_line === answer.line_end &&
      answer.spoiler_level === "safe",
    `Reader answer ${answer.answer_id} has an invalid spoiler boundary`,
  );
  for (const sourceId of answer.source_ids ?? []) {
    assert(
      sourceIds.has(sourceId),
      `Reader answer ${answer.answer_id} cites unknown source ${sourceId}`,
    );
  }
}

success(
  `${notes.length} notes and ${readerAnswers.length} reader answers across 24 books validated against knowledge-state reveal points`,
);
