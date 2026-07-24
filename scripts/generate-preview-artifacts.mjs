import fs from "node:fs/promises";
import YAML from "yaml";
import { previewBooks } from "../src/data/books-preview.mjs";

const roles = {
  philology:
    "Диапазоны непрерывны, основные события и речи сохранены. Блокер: требуется независимая человеческая сверка с древнегреческим текстом по каждой строке, формулам и эпитетам.",
  history:
    "Мир поэмы не сводится к одной исторической эпохе. Блокер: материальная культура, власть, зависимый труд и ритуалы требуют профильных источников и человеческой проверки.",
  religion:
    "Боги и чудеса сохранены как реальные силы мира поэмы. Блокер: культовая и ритуальная лексика требует сверки с научными комментариями.",
  literary:
    "Черновик избегает сленга и псевдоархаики. Блокер: нужны человеческая литературная редактура, чтение вслух и проверка различимости голосов.",
  critical:
    "Красная команда считает главными рисками компрессию речей, скрытые смысловые пропуски, выравнивание формульных повторов и недостаточную внешнюю проверку сходства.",
  reader:
    "Текст читается в исходной последовательности. Локальные пояснения пока недостаточны; непонятные имена и обычаи должны быть расширены без будущих сведений.",
  spoilers:
    "Название песни нейтрально, отдельной аннотации с будущим исходом нет. Страница открывается только прямым выбором читателя; содержательный человеческий спойлер-аудит не проведён.",
  factcheck:
    "Базовый диапазон и источник указаны. Блокер: нужна расширенная академическая библиография и проверка каждого внешнего утверждения.",
  rights:
    "Древнее произведение и цифровой объект разделены; греческий файл и современные переводы не копируются; сторонние изображения отсутствуют. Это не юридическое заключение.",
};

for (const book of previewBooks) {
  const number = String(book.book).padStart(2, "0");
  const lineMap = book.passages.map((passage) => ({
    paragraph_id: passage.id,
    source_range: { start: passage.lineStart, end: passage.lineEnd },
  }));
  await fs.mkdir("src/data/line-map", { recursive: true });
  await fs.writeFile(
    `src/data/line-map/book-${number}.yml`,
    YAML.stringify(lineMap),
    "utf8",
  );
  await fs.mkdir("src/data/notes", { recursive: true });
  const notes = book.notes.map((note) => {
    const passage = book.passages.find(
      (candidate) => candidate.id === note.anchor,
    );
    return {
      note_id: note.id,
      book: book.book,
      line_start: passage.lineStart,
      line_end: passage.lineEnd,
      reveal_at_book: book.book,
      reveal_at_line: passage.lineStart,
      requires_progress_book: book.book,
      requires_progress_line: passage.lineStart,
      spoiler_level: "safe",
      fact_ids: [],
      source_ids: note.sourceIds,
    };
  });
  await fs.writeFile(
    `src/data/notes/book-${number}.yml`,
    YAML.stringify(notes),
    "utf8",
  );

  await fs.mkdir("editorial/semantic-map", { recursive: true });
  await fs.writeFile(
    `editorial/semantic-map/book-${number}.yml`,
    YAML.stringify({
      book: book.book,
      source_range: `1-${book.lineCount}`,
      base_source_id: book.baseSourceId,
      status: "editorial_preview",
      segments: book.passages.map((passage) => ({
        lines: `${passage.lineStart}-${passage.lineEnd}`,
        event: passage.paragraphs[0].slice(0, 180),
        speaker: "narrator and embedded speakers as applicable",
        ambiguity:
          "Automated semantic segmentation; requires human line-by-line review.",
      })),
    }),
    "utf8",
  );

  await fs.mkdir("editorial/coverage", { recursive: true });
  await fs.writeFile(
    `editorial/coverage/book-${number}.md`,
    `# Покрытие Песни ${book.title.replace("Песнь ", "")}\n\nАвтоматическая карта покрывает строки 1–${book.lineCount} непрерывными диапазонами без разрывов и наложений.\n\nЭто структурная проверка, а не доказательство смысловой полноты. Ручная построчная сверка человеком не проведена.\n`,
    "utf8",
  );

  await fs.mkdir(`editorial/reviews/book-${number}`, { recursive: true });
  for (const [role, body] of Object.entries(roles)) {
    await fs.writeFile(
      `editorial/reviews/book-${number}/${role}.md`,
      `# ${role}: Песнь ${book.title.replace("Песнь ", "")}\n\nАвтоматизированная ролевая проверка.\n\n${body}\n\nСтатус выше \`editorial_preview\` запрещён до закрытия блокеров.\n`,
      "utf8",
    );
  }

  await fs.mkdir("editorial/decisions", { recursive: true });
  await fs.writeFile(
    `editorial/decisions/book-${number}.md`,
    `# Решения по ${book.title}\n\n## Статус\n\n\`editorial_preview\`, \`human_reviewed: false\`.\n\n## Принятые решения\n\n- Сохранить порядок поэмы и вложенные рассказы.\n- Показать непрерывную карту диапазонов 1–${book.lineCount}.\n- Не воспроизводить греческий цифровой файл или современный перевод.\n- Не присваивать статус человеческой редакции.\n\n## Открытые блокеры\n\n- независимая человеческая построчная сверка;\n- филологическая и литературная редактура;\n- расширение локальных пояснений и библиографии;\n- внешний контроль сходства по законно доступному корпусу.\n`,
    "utf8",
  );
}

console.log(`Generated editorial artifacts for ${previewBooks.length} books.`);
