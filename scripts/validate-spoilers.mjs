import { assert, readYaml, success } from "./lib.mjs";

const facts = await readYaml("src/data/knowledge-state.yml");
const notes = await readYaml("src/data/notes/book-01.yml");
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

success(
  `${notes.length} notes validated against knowledge-state reveal points`,
);
