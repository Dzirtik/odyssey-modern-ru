import fs from "node:fs/promises";
import YAML from "yaml";
import { bookOne } from "../../src/data/book-one.ts";
import { bookTwo } from "../../src/data/book-two.ts";
import { bookThree } from "../../src/data/book-three.ts";
import { bookFour } from "../../src/data/book-four.ts";
import { bookFive } from "../../src/data/book-five.ts";
import { bookSix } from "../../src/data/book-six.ts";
import { bookSeven } from "../../src/data/book-seven.ts";
import { bookEight } from "../../src/data/book-eight.ts";
import { bookNine } from "../../src/data/book-nine.ts";
import { bookTen } from "../../src/data/book-ten.ts";
import { bookEleven } from "../../src/data/book-eleven.ts";
import { bookTwelve } from "../../src/data/book-twelve.ts";
import { bookThirteen } from "../../src/data/book-thirteen.ts";
import { bookFourteen } from "../../src/data/book-fourteen.ts";
import { bookFifteen } from "../../src/data/book-fifteen.ts";
import { bookSixteen } from "../../src/data/book-sixteen.ts";
import { bookSeventeen } from "../../src/data/book-seventeen.ts";
import { bookEighteen } from "../../src/data/book-eighteen.ts";
import { bookNineteen } from "../../src/data/book-nineteen.ts";
import { bookTwenty } from "../../src/data/book-twenty.ts";
import { bookTwentyOne } from "../../src/data/book-twenty-one.ts";
import { bookTwentyTwo } from "../../src/data/book-twenty-two.ts";
import { bookTwentyThree } from "../../src/data/book-twenty-three.ts";
import { bookTwentyFour } from "../../src/data/book-twenty-four.ts";
import { buildBookOneAudioScript } from "./book-one.mjs";

export const books = [
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
];

const peoplePath = new URL("../../src/data/people.yml", import.meta.url);
const model = "gpt-4o-mini-tts";
const narrator = {
  id: "narrator",
  label: "Рассказчик",
  voice: "cedar",
  instructions:
    "Говори только по-русски. Спокойный, ясный, литературный рассказчик большой эпической аудиокниги. Естественная русская просодия, сдержанное достоинство, средний темп, точные ударения, без театрального пафоса.",
};
const maleVoices = ["onyx", "ash", "echo", "verse", "fable", "ballad", "alloy"];
const femaleVoices = ["marin", "coral", "nova", "sage", "shimmer"];
const fixedVoices = new Map([
  ["Одиссей", "onyx"],
  ["Телемах", "ash"],
  ["Пенелопа", "coral"],
  ["Афина", "marin"],
  ["Зевс", "echo"],
  ["Посейдон", "verse"],
  ["Антиной", "echo"],
  ["Евримах", "verse"],
  ["Калипсо", "shimmer"],
  ["Кирка", "nova"],
  ["Навсикая", "sage"],
  ["Евмей", "fable"],
  ["Менелай", "ballad"],
  ["Нестор", "alloy"],
]);
const dialogueOverrides = new Map(
  Object.entries({
    "2:lines-15-38:1": "Египтий",
    "2:lines-39-59:0": "Телемах",
    "2:lines-39-59:1": "Телемах",
    "2:lines-60-79:0": "Телемах",
    "2:lines-60-79:1": "Телемах",
    "2:lines-80-109:1": "Антиной",
    "2:lines-80-109:2": "Пенелопа",
    "2:lines-110-128:0": "Антиной",
    "2:lines-110-128:1": "Антиной",
    "2:lines-129-145:0": "Телемах",
    "2:lines-129-145:1": "Телемах",
    "2:lines-146-176:2": "Галиферс",
    "2:lines-177-207:0": "Евримах",
    "2:lines-177-207:2": "Евримах",
    "2:lines-208-223:0": "Телемах",
    "2:lines-208-223:2": "Телемах",
    "2:lines-224-259:1": "Ментор",
    "2:lines-224-259:2": "Леокрит",
    "2:lines-260-297:0": "Телемах",
    "2:lines-260-297:1": "Афина",
    "2:lines-260-297:2": "Афина",
    "2:lines-298-336:1": "Антиной",
    "2:lines-298-336:2": "Телемах",
    "2:lines-361-381:0": "Евриклея",
    "2:lines-361-381:1": "Телемах",
    "2:lines-388-404:2": "Афина",
    "2:lines-405-434:0": "Телемах",
    "3:lines-25-62:0": "Афина",
    "3:lines-63-85:0": "Нестор",
    "3:lines-63-85:1": "Телемах",
    "3:lines-86-119:0": "Телемах",
    "3:lines-188-222:1": "Нестор",
    "3:lines-223-260:1": "Афина",
    "3:lines-223-260:2": "Телемах",
    "3:lines-329-355:1": "Нестор",
    "4:lines-30-58:0": "Менелай",
    "9:lines-307-335:1": "Одиссей",
    "9:lines-336-359:1": "Полифем",
    "15:lines-526-557:2": "narrator",
  }),
);
const speechCue =
  /(сказ|говор|ответ|обрат|восклик|спрос|приказ|попрос|молил|молился|упрек|продолж|пригроз|поднял[^.!?]{0,30}голос|заговор|велел|велела|позвал|успокоил|рассказал|объявил|возразил|закрич|шепнул|потребовал|пообещал|признал|напомнил|похвалил)/iu;

const normalize = (value) =>
  String(value).toLocaleLowerCase("ru").replaceAll("ё", "е");

const nameRoot = (value) => {
  const firstWord = normalize(value).match(/[а-я]+/u)?.[0] ?? "";
  return firstWord.slice(0, Math.min(5, firstWord.length));
};

const isFemale = (type) =>
  /(смертная|богиня|нимфа|царица|женщина)/iu.test(type);

const stableVoice = (person, index) => {
  const fixed = fixedVoices.get(person.name);
  if (fixed) return fixed;
  const pool = isFemale(person.type) ? femaleVoices : maleVoices;
  return pool[index % pool.length];
};

const roleInstructions = (person, voice) => {
  const register = isFemale(person.type)
    ? "взрослый женский голос"
    : "взрослый мужской голос";
  return `Говори только по-русски. Реплика персонажа ${person.name}: ${register}, естественная литературная русская речь, ясная дикция, умеренный темп и эмоциональная точность без карикатуры и театрального переигрывания. Сохраняй характерный тембр голоса ${voice} во всех репликах.`;
};

const people = [
  ...YAML.parse(await fs.readFile(peoplePath, "utf8")),
  {
    name: "Египтий",
    type: "смертный",
    aliases: ["старейшина Итаки"],
  },
].map((person, index) => {
  const roots = [person.name, ...(person.aliases ?? [])]
    .map(nameRoot)
    .filter((root) => root.length >= 4);
  const voice = stableVoice(person, index);
  return {
    ...person,
    id: `character-${String(index + 1).padStart(3, "0")}`,
    roots: [...new Set(roots)],
    voice,
    instructions: roleInstructions(person, voice),
  };
});
const peopleByName = new Map(people.map((person) => [person.name, person]));

const findLastPerson = (value) => {
  const normalized = normalize(value);
  let match = null;
  for (const person of people) {
    for (const root of person.roots) {
      const index = normalized.lastIndexOf(root);
      if (
        index >= 0 &&
        (!match ||
          index > match.index ||
          (index === match.index && root.length > match.root.length))
      ) {
        match = { person, index, root };
      }
    }
  }
  return match?.person ?? null;
};

const contextSpeaker = (before, after, state, quote) => {
  const leadingContext = before.slice(-320);
  const trailingContext = after.slice(0, 220);
  const leadingPerson = findLastPerson(leadingContext);
  const trailingPerson = findLastPerson(trailingContext);
  const leadingCue =
    speechCue.test(leadingContext) || /:\s*$/u.test(leadingContext);
  const trailingCue = speechCue.test(trailingContext);

  if (leadingCue && leadingPerson) return leadingPerson;
  if (trailingCue && trailingPerson) return trailingPerson;
  if ((leadingCue || trailingCue) && state.pendingSpeaker) {
    return state.pendingSpeaker;
  }
  if (!before.trim() && state.lastSpeaker && quote.trim().length > 30) {
    return state.lastSpeaker;
  }
  return null;
};

const splitQuotedParagraph = (
  paragraph,
  state,
  bookNumber,
  passageId,
  paragraphIndex,
) => {
  const parts = [];
  let cursor = 0;
  let foundQuote = false;

  while (cursor < paragraph.length) {
    const open = paragraph.indexOf("«", cursor);
    if (open < 0) {
      const rest = paragraph.slice(cursor);
      if (rest) parts.push({ speaker: null, text: rest });
      break;
    }
    const close = paragraph.indexOf("»", open + 1);
    if (close < 0) {
      const rest = paragraph.slice(cursor);
      if (rest) parts.push({ speaker: null, text: rest.replaceAll("«", "") });
      break;
    }

    foundQuote = true;
    const prefix = paragraph.slice(cursor, open);
    if (prefix) parts.push({ speaker: null, text: prefix });
    const quote = paragraph.slice(open + 1, close);
    const override = dialogueOverrides.get(
      `${bookNumber}:${passageId}:${paragraphIndex}`,
    );
    const person =
      override === "narrator"
        ? null
        : override
          ? peopleByName.get(override)
          : contextSpeaker(
              paragraph.slice(0, open),
              paragraph.slice(close + 1),
              state,
              quote,
            );
    if (override && override !== "narrator" && !person) {
      throw new Error(`Unknown audio dialogue override: ${override}`);
    }
    parts.push({ speaker: person, text: quote });
    if (person) {
      state.lastSpeaker = person;
      state.pendingSpeaker = person;
    }
    cursor = close + 1;
  }

  const paragraphPerson = findLastPerson(paragraph);
  if (speechCue.test(paragraph) && paragraphPerson) {
    state.pendingSpeaker = paragraphPerson;
  } else if (!foundQuote) {
    state.pendingSpeaker = null;
  }

  return parts;
};

export async function buildBookAudioScript(bookNumber) {
  if (bookNumber === 1) return buildBookOneAudioScript();
  const book = books[bookNumber - 1];
  if (!book) throw new Error(`Unknown book ${bookNumber}`);

  const state = { lastSpeaker: null, pendingSpeaker: null };
  const segments = [];
  const voices = {
    narrator: {
      label: narrator.label,
      voice: narrator.voice,
      instructions: narrator.instructions,
    },
  };
  let paragraphNumber = 0;

  for (const passage of book.passages) {
    for (
      let paragraphIndex = 0;
      paragraphIndex < passage.paragraphs.length;
      paragraphIndex += 1
    ) {
      paragraphNumber += 1;
      const paragraph = passage.paragraphs[paragraphIndex];
      const parts = splitQuotedParagraph(
        paragraph,
        state,
        bookNumber,
        passage.id,
        paragraphIndex,
      );
      const reconstructed = parts.map((part) => part.text).join("");
      if (reconstructed !== paragraph.replace(/[«»]/gu, "")) {
        throw new Error(
          `${passage.id}[${paragraphIndex}] audio segmentation changed the source text`,
        );
      }

      parts
        .filter((part) => part.text.trim())
        .forEach((part, partIndex) => {
          const role = part.speaker
            ? {
                id: part.speaker.id,
                label: part.speaker.name,
                voice: part.speaker.voice,
                instructions: part.speaker.instructions,
              }
            : narrator;
          voices[role.id] ??= {
            label: role.label,
            voice: role.voice,
            instructions: role.instructions,
          };
          segments.push({
            id: `${passage.id}-p${String(paragraphIndex + 1).padStart(2, "0")}-s${partIndex + 1}`,
            passageId: passage.id,
            lines: passage.lines,
            paragraphIndex,
            paragraphNumber,
            partIndex,
            speaker: role.id,
            speakerLabel: role.label,
            voice: role.voice,
            instructions: role.instructions,
            text: part.text.trim(),
          });
        });
    }
  }

  return {
    book: book.book,
    title: book.title,
    sourceRange: book.sourceRange,
    model,
    voices,
    paragraphCount: paragraphNumber,
    sourceCharacterCount: book.passages
      .flatMap((passage) => passage.paragraphs)
      .join("\n").length,
    segments,
  };
}
