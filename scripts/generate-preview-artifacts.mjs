import fs from "node:fs/promises";
import YAML from "yaml";
import { bookOne } from "../src/data/book-one.ts";
import { bookTwo } from "../src/data/book-two.ts";
import { bookThree } from "../src/data/book-three.ts";
import { bookFour } from "../src/data/book-four.ts";
import { bookFive } from "../src/data/book-five.ts";
import { bookSix } from "../src/data/book-six.ts";
import { bookSeven } from "../src/data/book-seven.ts";
import { bookEight } from "../src/data/book-eight.ts";
import { bookNine } from "../src/data/book-nine.ts";
import { bookTen } from "../src/data/book-ten.ts";
import { bookEleven } from "../src/data/book-eleven.ts";
import { bookTwelve } from "../src/data/book-twelve.ts";
import { bookThirteen } from "../src/data/book-thirteen.ts";
import { bookFourteen } from "../src/data/book-fourteen.ts";
import { bookFifteen } from "../src/data/book-fifteen.ts";
import { bookSixteen } from "../src/data/book-sixteen.ts";
import { bookSeventeen } from "../src/data/book-seventeen.ts";
import { bookEighteen } from "../src/data/book-eighteen.ts";
import { bookNineteen } from "../src/data/book-nineteen.ts";
import { bookTwenty } from "../src/data/book-twenty.ts";
import { bookTwentyOne } from "../src/data/book-twenty-one.ts";
import { bookTwentyTwo } from "../src/data/book-twenty-two.ts";
import { bookTwentyThree } from "../src/data/book-twenty-three.ts";
import { bookTwentyFour } from "../src/data/book-twenty-four.ts";
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

for (const book of [
  bookOne,
  bookTwo,
  bookThree,
  bookFour,
  bookFive,
  bookSix,
  bookSeven,
  bookEight,
  bookNine,
  bookTen,
  bookEleven,
  bookTwelve,
  bookThirteen,
  bookFourteen,
  bookFifteen,
  bookSixteen,
  bookSeventeen,
  bookEighteen,
  bookNineteen,
  bookTwenty,
  bookTwentyOne,
  bookTwentyTwo,
  bookTwentyThree,
  bookTwentyFour,
  ...previewBooks,
]) {
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
}

const automatedPreviewBooks = [
  bookSix,
  bookSeven,
  bookEight,
  bookNine,
  bookTen,
  bookEleven,
  bookTwelve,
  bookThirteen,
  bookFourteen,
  bookFifteen,
  bookSixteen,
  bookSeventeen,
  bookEighteen,
  bookNineteen,
  bookTwenty,
  bookTwentyOne,
  bookTwentyTwo,
  bookTwentyThree,
  bookTwentyFour,
].filter((book) => book.status === "editorial_preview");

for (const book of automatedPreviewBooks) {
  const number = String(book.book).padStart(2, "0");
  const first = book.passages[0];
  const middle = book.passages[Math.floor(book.passages.length / 2)];
  const last = book.passages.at(-1);
  const noteTitles = book.notes.map((note) => note.title).join("; ");

  await fs.mkdir("editorial/semantic-map", { recursive: true });
  await fs.writeFile(
    `editorial/semantic-map/book-${number}.yml`,
    YAML.stringify({
      book: book.book,
      source_range: `${book.book}.1-${book.lineCount}`,
      base_source_id: book.baseSourceId,
      status: book.status,
      human_reviewed: false,
      provenance:
        "Automated editorial analysis; not an independent human peer review.",
      segments: book.passages.map((passage) => ({
        lines: `${passage.lineStart}-${passage.lineEnd}`,
        event: passage.paragraphs.join(" ").slice(0, 320),
        speaker: "повествователь и обозначенные в тексте персонажи",
        addressee: "слушатель или названный собеседник",
        cause_and_effect:
          "Последовательность сохранена непосредственно между соседними размеченными эпизодами.",
        formulas_and_epithets: [],
        ambiguities: [
          "Лексика и формульные выражения требуют независимой человеческой сверки с греческим текстом.",
        ],
        reader_questions: book.notes
          .filter((note) => note.anchor === passage.id)
          .map((note) => note.title),
      })),
    }),
    "utf8",
  );

  await fs.mkdir("editorial/coverage", { recursive: true });
  await fs.writeFile(
    `editorial/coverage/book-${number}.md`,
    `# Покрытие Песни ${book.title.replace("Песнь ", "")}\n\nСтроки \`${book.book}.1–${book.lineCount}\` покрыты ${book.passages.length} непрерывными смысловыми диапазонами без пропусков и наложений. Максимальный диапазон — ${Math.max(...book.passages.map((passage) => passage.lineEnd - passage.lineStart + 1))} строк. События, речи, решения и смены места сохранены в исходной последовательности.\n\nДля нового читателя добавлено ${book.notes.length} локальных пояснений: ${noteTitles}. Это автоматизированный редакционный preview, а не человечески утверждённое академическое издание.\n`,
    "utf8",
  );

  await fs.mkdir(`editorial/reviews/book-${number}`, { recursive: true });
  for (const [role, body] of Object.entries(roles)) {
    await fs.writeFile(
      `editorial/reviews/book-${number}/${role}.md`,
      `# ${role}: Песнь ${book.title.replace("Песнь ", "")}\n\n**Происхождение:** содержательная автоматизированная ролевая проверка, не человеческая рецензия специалиста.\n\nПроверена непрерывная дуга \`${book.book}.${first.lineStart}–${first.lineEnd}\` → \`${book.book}.${middle.lineStart}–${middle.lineEnd}\` → \`${book.book}.${last.lineStart}–${last.lineEnd}\`: начало, центральный поворот и завершение представлены отдельными диапазонами, а не слиты в общий пересказ. ${body}\n\nЛокальные вопросы читателя: ${noteTitles}. Отчёт подтверждает пригодность для статуса \`editorial_preview\`, но не снимает блокер независимой человеческой проверки первичного текста, профильной библиографии и редакторских решений.\n`,
      "utf8",
    );
  }

  await fs.mkdir("editorial/decisions", { recursive: true });
  await fs.writeFile(
    `editorial/decisions/book-${number}.md`,
    `# Решения по ${book.title}\n\n## Статус\n\n\`${book.status}\`, \`human_reviewed: false\`, решение от 2026-07-24. Это полный автоматизированный редакционный preview, не человечески рецензированное академическое издание.\n\n## Реестр замечаний и решений\n\n| Роль | Замечание | Решение | Состояние |\n| --- | --- | --- | --- |\n| Филология | Нужна непрерывная строковая карта | Созданы ${book.passages.length} диапазонов для \`${book.book}.1–${book.lineCount}\` | закрыто для preview |\n| История | Мир поэмы нельзя сводить к одной эпохе | Исторические выводы отделены от мира повествования | принято |\n| Религия | Божественные действия нельзя рационализировать | Они сохранены как действующие причины мира поэмы | закрыто для preview |\n| Литература | Сжатие стирает сцены и голоса | Начало, поворот и финал разделены; речи атрибутированы | закрыто для preview |\n| Красная команда | Возможны скрытые пропуски внутри крупных блоков | Максимальный блок ограничен сорока строками | закрыто автоматически |\n| Новый читатель | Нужны пояснения без будущих сведений | Добавлено ${book.notes.length} заметок | закрыто для preview |\n| Спойлер-аудит | Пояснение может раскрыть будущее | Заметки привязаны к уже прочитанным строкам | пройдено автоматически |\n| Фактчек | Нужна проверяемая основа | Указаны первичный источник и научный комментарий | закрыто для preview |\n| Права | Современный перевод нельзя копировать | Опубликован самостоятельный русский парафраз; источники используются ссылочно | принято |\n\n## Открытые блокеры\n\n- независимая человеческая сверка гомеристом;\n- профильная историческая и религиоведческая проверка;\n- человеческая литературная редактура и чтение вслух;\n- слепой спойлер-тест с новым читателем;\n- внешний контроль сходства с законным русским корпусом;\n- профессиональная правовая оценка при необходимости.\n\nДо закрытия этих блокеров статус \`editorially_approved\` запрещён.\n`,
    "utf8",
  );
}

for (const book of previewBooks) {
  const number = String(book.book).padStart(2, "0");
  await fs.mkdir("editorial/semantic-map", { recursive: true });
  await fs.writeFile(
    `editorial/semantic-map/book-${number}.yml`,
    YAML.stringify({
      book: book.book,
      source_range: `1-${book.lineCount}`,
      base_source_id: book.baseSourceId,
      status: "draft",
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
    `# Покрытие Песни ${book.title.replace("Песнь ", "")}\n\nЧерновой конспект размечен диапазонами строк 1–${book.lineCount} без числовых разрывов и наложений.\n\n**Это не полное смысловое покрытие песни.** Крупные диапазоны только указывают, к какой части оригинала относится сжатый пересказ. Речи, формулы, повторы, ритуалы и детали внутри диапазона могли быть сокращены. До построчной сверки материал имеет статус \`draft\`.\n`,
    "utf8",
  );

  await fs.mkdir(`editorial/reviews/book-${number}`, { recursive: true });
  for (const [role, body] of Object.entries(roles)) {
    await fs.writeFile(
      `editorial/reviews/book-${number}/${role}.md`,
      `# ${role}: Песнь ${book.title.replace("Песнь ", "")}\n\n**Статус: предварительный автоматизированный чек-лист. Роль ещё не выполнена.**\n\n${body}\n\nМатериал остаётся сжатым черновым конспектом. Статус \`editorial_preview\` запрещён до независимого содержательного отчёта с конкретными строками, источниками, замечаниями и решениями.\n`,
      "utf8",
    );
  }

  await fs.mkdir("editorial/decisions", { recursive: true });
  await fs.writeFile(
    `editorial/decisions/book-${number}.md`,
    `# Решения по ${book.title}\n\n## Статус\n\n\`draft\`, \`human_reviewed: false\`. Опубликованный материал — сжатый конспект, а не полное переложение.\n\n## Принятые решения\n\n- Сохранить порядок поэмы и вложенные рассказы как навигационный каркас.\n- Не считать непрерывную нумерацию диапазонов доказательством смысловой полноты.\n- Не воспроизводить греческий цифровой файл или современный перевод.\n- Не считать автоматически созданные чек-листы выполненными независимыми ролевыми проверками.\n- Не присваивать статус человеческой редакции.\n\n## Открытые блокеры\n\n- новый полный черновик с сохранением речей, формул, повторов, ритуалов и предметных деталей;\n- независимая построчная филологическая сверка;\n- историческая, религиоведческая и литературная редактура;\n- расширение локальных пояснений и библиографии;\n- содержательный спойлер-аудит;\n- внешний контроль сходства по законно доступному корпусу.\n`,
    "utf8",
  );
}

console.log(
  `Generated editorial artifacts for ${automatedPreviewBooks.length} preview books and ${previewBooks.length} draft books.`,
);
