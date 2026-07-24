import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import prettier from "prettier";
import {
  buildBookOneAudioScript,
  groupBookAudioSegments,
} from "./audio/book-one.mjs";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const concurrency = Math.max(
  1,
  Math.min(6, Number(process.env.AUDIO_CONCURRENCY ?? 3)),
);
const cacheRoot = path.join(root, ".audio-cache", "openai", "book-01");
const rawRoot = path.join(cacheRoot, "raw");
const normalizedRoot = path.join(cacheRoot, "normalized");
const outputRoot = path.join(root, "public", "audio", "books");
const outputAudio = path.join(outputRoot, "book-01.mp3");
const outputManifest = path.join(root, "src", "data", "audio", "book-01.json");
const exactReadingInstruction =
  " Прочитай весь предоставленный текст точно, ничего не добавляй, не сокращай и не пересказывай.";

const hash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 20);

const exists = async (file) => {
  try {
    const stat = await fs.stat(file);
    return stat.size > 44;
  } catch {
    return false;
  }
};

const run = async (command, args) => {
  try {
    return await execFileAsync(command, args, { maxBuffer: 10_000_000 });
  } catch (error) {
    const details = error.stderr || error.stdout || error.message;
    throw new Error(`${command} failed: ${details}`);
  }
};

const retryDelay = (attempt) =>
  new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** attempt));

async function synthesize(group, index, total, model, apiKey) {
  const fingerprint = hash(
    JSON.stringify({
      model,
      voice: group.voice,
      instructions: group.instructions,
      text: group.text,
    }),
  );
  const file = path.join(rawRoot, `${group.id}-${fingerprint}.wav`);
  if (await exists(file)) {
    console.log(`↻ ${index + 1}/${total} ${group.speakerLabel} (cache)`);
    return { ...group, rawFile: file, fingerprint };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: group.voice,
        input: group.text,
        instructions: `${group.instructions}${exactReadingInstruction}`,
        response_format: "wav",
      }),
    });

    if (response.ok) {
      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.subarray(0, 4).toString("ascii") !== "RIFF") {
        throw new Error(`${group.id} did not return a WAV file`);
      }
      await fs.writeFile(file, audio);
      console.log(`✓ ${index + 1}/${total} ${group.speakerLabel}`);
      return { ...group, rawFile: file, fingerprint };
    }

    const message = await response.text();
    if (attempt < 2 && (response.status === 429 || response.status >= 500)) {
      await retryDelay(attempt);
      continue;
    }
    throw new Error(
      `${group.id} failed with ${response.status}: ${message.slice(0, 500)}`,
    );
  }

  throw new Error(`${group.id} failed after retries`);
}

async function mapWithConcurrency(items, workerCount, task) {
  const results = new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(workerCount, items.length) }, worker),
  );
  return results;
}

const audioScript = await buildBookOneAudioScript();
const groups = groupBookAudioSegments(audioScript.segments);
const summary = {
  book: audioScript.book,
  paragraphs: audioScript.paragraphCount,
  utterances: audioScript.segments.length,
  requests: groups.length,
  characters: groups.reduce((sum, group) => sum + group.text.length, 0),
  speakers: [...new Set(groups.map((group) => group.speakerLabel))],
};

console.log(JSON.stringify(summary, null, 2));
if (dryRun) process.exit(0);

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
await fs.mkdir(rawRoot, { recursive: true });
await fs.mkdir(normalizedRoot, { recursive: true });
await fs.mkdir(outputRoot, { recursive: true });
await fs.mkdir(path.dirname(outputManifest), { recursive: true });

const rendered = await mapWithConcurrency(groups, concurrency, (group, index) =>
  synthesize(group, index, groups.length, audioScript.model, apiKey),
);

for (const group of rendered) {
  const normalizedFile = path.join(
    normalizedRoot,
    `${group.id}-${group.fingerprint}.wav`,
  );
  if (!(await exists(normalizedFile))) {
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      group.rawFile,
      "-af",
      "loudnorm=I=-18:TP=-2:LRA=7",
      "-ar",
      "24000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      normalizedFile,
    ]);
  }
  group.normalizedFile = normalizedFile;
}

const shortSilence = path.join(cacheRoot, "silence-220ms.wav");
const paragraphSilence = path.join(cacheRoot, "silence-520ms.wav");
for (const [file, duration] of [
  [shortSilence, "0.22"],
  [paragraphSilence, "0.52"],
]) {
  if (!(await exists(file))) {
    await run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `anullsrc=r=24000:cl=mono:d=${duration}`,
      "-c:a",
      "pcm_s16le",
      file,
    ]);
  }
}

const concatFiles = [];
for (let index = 0; index < rendered.length; index += 1) {
  const group = rendered[index];
  concatFiles.push(group.normalizedFile);
  const nextGroup = rendered[index + 1];
  if (!nextGroup) continue;
  const currentParagraph = group.segments.at(-1).paragraphNumber;
  const nextParagraph = nextGroup.segments[0].paragraphNumber;
  concatFiles.push(
    currentParagraph === nextParagraph ? shortSilence : paragraphSilence,
  );
}

const concatList = path.join(cacheRoot, "concat.txt");
await fs.writeFile(
  concatList,
  concatFiles
    .map((file) => `file '${file.replaceAll("'", "'\\''")}'`)
    .join("\n"),
);
const assembled = path.join(cacheRoot, "assembled.wav");
await run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  concatList,
  "-c:a",
  "pcm_s16le",
  assembled,
]);
await run("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  assembled,
  "-af",
  "loudnorm=I=-16:TP=-1.5:LRA=7",
  "-c:a",
  "libmp3lame",
  "-b:a",
  "96k",
  outputAudio,
]);

const { stdout: durationText } = await run("ffprobe", [
  "-v",
  "error",
  "-show_entries",
  "format=duration",
  "-of",
  "default=noprint_wrappers=1:nokey=1",
  outputAudio,
]);
const duration = Number(durationText.trim());
const manifest = {
  schema: 1,
  book: audioScript.book,
  title: audioScript.title,
  sourceRange: audioScript.sourceRange,
  provider: "OpenAI",
  model: audioScript.model,
  aiGenerated: true,
  disclosure:
    "Озвучено синтетическими голосами ИИ. Это не записи актёров и не имитация конкретных людей.",
  file: "book-01.mp3",
  durationSeconds: duration,
  characterCount: summary.characters,
  paragraphCount: summary.paragraphs,
  voices: Object.fromEntries(
    Object.entries(audioScript.voices).map(([id, voice]) => [
      id,
      { label: voice.label, voice: voice.voice },
    ]),
  ),
  groups: rendered.map((group) => ({
    id: group.id,
    speaker: group.speaker,
    speakerLabel: group.speakerLabel,
    voice: group.voice,
    sourceSegments: group.segments.map((segment) => segment.id),
    text: group.text,
    fingerprint: group.fingerprint,
  })),
};
await fs.writeFile(
  outputManifest,
  await prettier.format(JSON.stringify(manifest), { parser: "json" }),
);

console.log(
  `✓ ${path.relative(root, outputAudio)} · ${(duration / 60).toFixed(1)} min`,
);
