import fs from "node:fs/promises";
import YAML from "yaml";
import { bookOne } from "../../src/data/book-one.ts";

const manifestPath = new URL(
  "../../audio-scripts/book-01.yml",
  import.meta.url,
);

const withoutGuillemets = (value) => value.replace(/[«»]/g, "");

const splitDialogue = (paragraph, entry) => {
  const open = paragraph.indexOf("«");
  const close = paragraph.lastIndexOf("»");
  if (open < 0 || close <= open) {
    throw new Error(
      `${entry.anchor}[${entry.paragraph}] is marked as dialogue but has no complete quotation`,
    );
  }

  const parts = [];
  const prefix = paragraph.slice(0, open);
  const speech = paragraph.slice(open + 1, close);
  const suffix = paragraph.slice(close + 1);
  if (prefix) parts.push({ speaker: "narrator", text: prefix });

  if (entry.inline_attribution) {
    const marker = entry.inline_attribution;
    const markerIndex = speech.indexOf(marker);
    if (markerIndex < 0) {
      throw new Error(
        `${entry.anchor}[${entry.paragraph}] is missing inline attribution ${marker}`,
      );
    }
    parts.push({
      speaker: entry.speaker,
      text: speech.slice(0, markerIndex),
    });
    parts.push({ speaker: "narrator", text: marker });
    parts.push({
      speaker: entry.speaker,
      text: speech.slice(markerIndex + marker.length),
    });
  } else {
    parts.push({ speaker: entry.speaker, text: speech });
  }

  if (suffix) parts.push({ speaker: "narrator", text: suffix });
  return parts.filter((part) => part.text.trim());
};

export async function buildBookOneAudioScript() {
  const config = YAML.parse(await fs.readFile(manifestPath, "utf8"));
  const dialogue = new Map(
    config.dialogue.map((entry) => [
      `${entry.anchor}:${entry.paragraph}`,
      entry,
    ]),
  );
  const segments = [];
  let paragraphNumber = 0;

  for (const passage of bookOne.passages) {
    for (
      let paragraphIndex = 0;
      paragraphIndex < passage.paragraphs.length;
      paragraphIndex += 1
    ) {
      paragraphNumber += 1;
      const paragraph = passage.paragraphs[paragraphIndex];
      const entry = dialogue.get(`${passage.id}:${paragraphIndex}`);
      const parts = entry
        ? splitDialogue(paragraph, entry)
        : [{ speaker: "narrator", text: paragraph }];
      const reconstructed = parts.map((part) => part.text).join("");
      if (reconstructed !== withoutGuillemets(paragraph)) {
        throw new Error(
          `${passage.id}[${paragraphIndex}] audio segmentation changed the source text`,
        );
      }

      parts.forEach((part, partIndex) => {
        const voice = config.voices[part.speaker];
        if (!voice) {
          throw new Error(`Unknown speaker ${part.speaker}`);
        }
        segments.push({
          id: `${passage.id}-p${String(paragraphIndex + 1).padStart(2, "0")}-s${partIndex + 1}`,
          passageId: passage.id,
          lines: passage.lines,
          paragraphIndex,
          paragraphNumber,
          partIndex,
          speaker: part.speaker,
          speakerLabel: voice.label,
          voice: voice.voice,
          instructions: voice.instructions,
          text: part.text.trim(),
        });
      });
    }
  }

  if (dialogue.size !== config.dialogue.length) {
    throw new Error("Duplicate dialogue entries in book-01.yml");
  }
  if (paragraphNumber !== 62) {
    throw new Error(`Expected 62 paragraphs, found ${paragraphNumber}`);
  }

  return {
    book: bookOne.book,
    title: bookOne.title,
    sourceRange: bookOne.sourceRange,
    model: config.model,
    voices: config.voices,
    paragraphCount: paragraphNumber,
    sourceCharacterCount: bookOne.passages
      .flatMap((passage) => passage.paragraphs)
      .join("\n").length,
    segments,
  };
}

export function groupBookAudioSegments(segments, maxCharacters = 2_800) {
  const groups = [];

  for (const segment of segments) {
    const previous = groups.at(-1);
    const previousSegment = previous?.segments.at(-1);
    const separator =
      previousSegment?.paragraphNumber === segment.paragraphNumber
        ? " "
        : "\n\n";
    const canAppend =
      previous &&
      previous.speaker === segment.speaker &&
      previous.text.length + separator.length + segment.text.length <=
        maxCharacters;

    if (canAppend) {
      previous.text += `${separator}${segment.text}`;
      previous.segments.push(segment);
      continue;
    }

    groups.push({
      id: `group-${String(groups.length + 1).padStart(3, "0")}`,
      speaker: segment.speaker,
      speakerLabel: segment.speakerLabel,
      voice: segment.voice,
      instructions: segment.instructions,
      text: segment.text,
      segments: [segment],
    });
  }

  return groups;
}
