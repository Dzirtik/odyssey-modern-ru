import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import YAML from "yaml";
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

test("Book I line map covers 1-444 exactly", async () => {
  const map = YAML.parse(
    await fs.readFile("src/data/line-map/book-01.yml", "utf8"),
  );
  const lines = map.flatMap(({ source_range }) =>
    Array.from(
      { length: source_range.end - source_range.start + 1 },
      (_, i) => source_range.start + i,
    ),
  );
  assert.deepEqual(
    lines,
    Array.from({ length: 444 }, (_, i) => i + 1),
  );
});

test("Book II is a continuous preview and no longer contains Book IV events", () => {
  assert.equal(bookTwo.status, "editorial_preview");
  assert.equal(bookTwo.passages[0].lineStart, 1);
  assert.equal(bookTwo.passages.at(-1).lineEnd, 434);

  let expected = 1;
  for (const passage of bookTwo.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 435);

  const text = bookTwo.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.doesNotMatch(text, /Астерис|Ифтим|засад/u);
  assert.match(text, /мачт|парус|возлияни/u);
});

test("all 24 book routes use the reader", async () => {
  const page = await fs.readFile("src/pages/book/[book].astro", "utf8");
  assert.match(page, /length: 24/);
  assert.match(page, /BookReader/);
  assert.equal(previewBooks.length, 0);
});

test("Book III is a continuous, source-dense editorial preview", () => {
  assert.equal(bookThree.status, "editorial_preview");
  assert.equal(bookThree.passages[0].lineStart, 1);
  assert.equal(bookThree.passages.at(-1).lineEnd, 497);
  assert.ok(bookThree.passages.length >= 12);
  assert.ok(bookThree.notes.length >= 4);

  let expected = 1;
  for (const passage of bookThree.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 498);

  const text = bookThree.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Посейдон|Нестор|Орест|Фронтис|Поликаст/u);
  assert.doesNotMatch(text, /Елена узнала|Протей|Фарос/u);
});

test("Book IV is a continuous preview with the two concurrent plots intact", () => {
  assert.equal(bookFour.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookFour.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 848);
  const text = bookFour.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Протей|Эйдофе|Ифтим|Астерис/u);
  assert.match(text, /двадцать.*человек|двадцать.*лучших/u);
});

test("Book V is a continuous preview from divine council to woodland sleep", () => {
  assert.equal(bookFive.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookFive.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 494);
  const text = bookFive.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Стикс|двадцать деревьев|Левкоте|речн/u);
});

test("Book VI is a continuous preview from Nausicaa's dream to the grove", () => {
  assert.equal(bookSix.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookSix.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 332);
  const text = bookSix.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Гипере|Димант|Арет|Делос|молв/u);
});

test("Book VII is a continuous preview from the city mist to palace sleep", () => {
  assert.equal(bookSeven.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookSeven.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 348);
  const text = bookSeven.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Евримедус|Эхеней|Понтоной|Эвбе/u);
});

test("Book VIII is a continuous preview through all three songs of Demodocus", () => {
  assert.equal(bookEight.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookEight.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 587);
  const text = bookEight.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Демодок|Филоктет|Эврита|Деифоб/u);
});

test("Book IX is a continuous self-narrated preview through the Cyclops episode", () => {
  assert.equal(bookNine.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookNine.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 567);
  const text = bookNine.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Исмар|Марон|Никто|Телем|Посейдон/u);
});

test("Book X is a continuous preview from Aeolus to the Ocean voyage", () => {
  assert.equal(bookTen.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookTen.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 575);
  const text = bookTen.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Эол|Антифат|моли|Еврилах|Элпенор/u);
});

test("Book XI is a continuous preview of the encounter with the dead", () => {
  assert.equal(bookEleven.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookEleven.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 641);
  const text = bookEleven.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Тирес|Антикле|Эрифил|Аякс|Сисиф/u);
});

test("Book XII is a continuous preview from Elpenor's burial to Ogygia", () => {
  assert.equal(bookTwelve.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookTwelve.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 454);
  const text = bookTwelve.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Сирен|Кратайид|Фринаки|Лампети|Харибд/u);
});

test("Book XIII is a continuous preview from Scheria to the swineherd plan", () => {
  assert.equal(bookThirteen.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookThirteen.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 441);
  const text = bookThirteen.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Форкис|Орсилох|Неритон|Воронь/u);
});

test("Book XIV is a continuous preview of Eumaeus' hospitality", () => {
  assert.equal(bookFourteen.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookFourteen.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 534);
  const text = bookFourteen.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Кастор|Фейдон|Додон|Тоас/u);
  assert.doesNotMatch(text, /Ктесий|Ктимен/u);
});

test("Book XV is a continuous preview joining Telemachus and Eumaeus", () => {
  assert.equal(bookFifteen.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookFifteen.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 558);
  const text = bookFifteen.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Феоклимен|Ктесий|Арибанд|Пирей/u);
});

test("Book XVI is a continuous preview of father-son recognition and planning", () => {
  assert.equal(bookSixteen.status, "editorial_preview");
  let expected = 1;
  for (const passage of bookSixteen.passages) {
    assert.equal(passage.lineStart, expected);
    expected = passage.lineEnd + 1;
  }
  assert.equal(expected, 482);
  const text = bookSixteen.passages
    .flatMap((passage) => passage.paragraphs)
    .join(" ");
  assert.match(text, /Аркес|Амфином|Медонт|Евримах/u);
});

for (const [book, expectedEnd, markers] of [
  [bookSeventeen, 606, /Феоклимен|Мелантий|Аргос|Антиной/u],
  [bookEighteen, 428, /Ир|Амфином|Меланфо|Евримах/u],
  [bookNineteen, 604, /Икмали|Автолик|Еврикле|Додон/u],
  [bookTwenty, 394, /Пандаре|Филойтий|Ктесипп|Феоклимен/u],
  [bookTwentyOne, 434, /Ифит|Леод|Филойтий|форминг/u],
  [bookTwentyTwo, 501, /Агелай|Леод|Фемий|Медонт|Мелантий/u],
  [bookTwentyThree, 372, /Акторид|Ламп|Фаэтон|весл/u],
  [bookTwentyFour, 548, /Амфимедонт|Нерик|Евпейт|Галиферс/u],
]) {
  test(`Book ${book.book} is a continuous source-dense editorial preview`, () => {
    assert.equal(book.status, "editorial_preview");
    let expected = 1;
    for (const passage of book.passages) {
      assert.equal(passage.lineStart, expected);
      expected = passage.lineEnd + 1;
    }
    assert.equal(expected, expectedEnd + 1);
    const text = book.passages
      .flatMap((passage) => passage.paragraphs)
      .join(" ");
    assert.match(text, markers);
  });
}

test("all 24 expanded books cover the complete source continuously", () => {
  for (const book of previewBooks) {
    assert.equal(book.status, "draft");
    let expected = 1;
    for (const passage of book.passages) {
      assert.equal(passage.lineStart, expected);
      expected = passage.lineEnd + 1;
    }
    assert.equal(expected, book.lineCount + 1);
  }
  assert.equal(
    444 +
      bookTwo.lineCount +
      bookThree.lineCount +
      bookFour.lineCount +
      bookFive.lineCount +
      bookSix.lineCount +
      bookSeven.lineCount +
      bookEight.lineCount +
      bookNine.lineCount +
      bookTen.lineCount +
      bookEleven.lineCount +
      bookTwelve.lineCount +
      bookThirteen.lineCount +
      bookFourteen.lineCount +
      bookFifteen.lineCount +
      bookSixteen.lineCount +
      bookSeventeen.lineCount +
      bookEighteen.lineCount +
      bookNineteen.lineCount +
      bookTwenty.lineCount +
      bookTwentyOne.lineCount +
      bookTwentyTwo.lineCount +
      bookTwentyThree.lineCount +
      bookTwentyFour.lineCount +
      previewBooks.reduce((sum, book) => sum + book.lineCount, 0),
    12110,
  );
});

test("no compressed draft remains in the publication route", () => {
  assert.deepEqual(previewBooks, []);
});

test("human review is not claimed", async () => {
  const [content, log] = await Promise.all([
    fs.readFile("src/data/book-one.ts", "utf8"),
    fs.readFile("HUMAN_EDITORIAL_LOG.md", "utf8"),
  ]);
  assert.match(content, /humanReviewed: false/);
  assert.match(log, /не зафиксировано/);
});

test("core accessibility affordances exist", async () => {
  const [layout, css] = await Promise.all([
    fs.readFile("src/layouts/BaseLayout.astro", "utf8"),
    fs.readFile("src/styles/global.css", "utf8"),
  ]);
  assert.match(layout, /class="skip-link"/);
  assert.match(layout, /<main id="main">/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media print/);
});

test("reader journey offers explicit resume without silent restoration", async () => {
  const [home, contents, reader] = await Promise.all([
    fs.readFile("src/pages/index.astro", "utf8"),
    fs.readFile("src/pages/read/index.astro", "utf8"),
    fs.readFile("src/components/BookReader.astro", "utf8"),
  ]);

  assert.match(home, /data-resume-link/);
  assert.match(home, /Можно начинать без подготовки/);
  assert.match(contents, /data-resume-panel/);
  assert.match(contents, /data-book-card/);
  assert.match(reader, /odyssey-last-book/);
  assert.doesNotMatch(reader, /saved\).*scrollIntoView/);
});

test("reader controls expose location and accessible progress", async () => {
  const [controls, reader] = await Promise.all([
    fs.readFile("src/components/ReadingControls.astro", "utf8"),
    fs.readFile("src/components/BookReader.astro", "utf8"),
  ]);

  assert.match(controls, /data-passage-select/);
  assert.match(controls, /Перейти к фрагменту/);
  assert.match(controls, /data-progress-status/);
  assert.match(reader, /role="progressbar"/);
  assert.match(reader, /aria-valuenow/);
});

test("automated reader answers are optional, grouped and plainly labelled", async () => {
  const reader = await fs.readFile("src/components/BookReader.astro", "utf8");

  assert.match(reader, /class="reader-answers"/);
  assert.match(reader, /Ответы на вопросы к этому фрагменту/);
  assert.match(reader, /Мир поэмы/);
  assert.match(reader, /надёжно подтверждено/);
  assert.doesNotMatch(reader, /Только по уже прочитанным строкам/);
});

test("Book III sacrifice answers follow the current line range", async () => {
  const answers = YAML.parse(
    await fs.readFile("src/data/reader-answers/book-03.yml", "utf8"),
  );
  const byQuestion = new Map(
    answers.map((answer) => [answer.question, answer]),
  );

  assert.match(
    byQuestion.get("Кто убивает животное?").summary,
    /Фрасимед.*Писистрат/u,
  );
  assert.match(
    byQuestion.get("Что сжигают для богини?").summary,
    /прядь.*огонь/u,
  );
  assert.doesNotMatch(
    byQuestion.get("Что сжигают для богини?").details,
    /части бёдер|б[её]дра/u,
  );
});
