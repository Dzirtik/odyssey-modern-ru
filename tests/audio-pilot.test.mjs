import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  buildBookOneAudioScript,
  groupBookAudioSegments,
} from "../scripts/audio/book-one.mjs";

test("Book I audio script preserves all paragraphs and assigns the cast", async () => {
  const script = await buildBookOneAudioScript();
  const groups = groupBookAudioSegments(script.segments);

  assert.equal(script.paragraphCount, 62);
  assert.equal(script.sourceCharacterCount, 18_552);
  assert.ok(groups.length > 1);
  assert.deepEqual(
    new Set(script.segments.map((segment) => segment.speaker)),
    new Set([
      "narrator",
      "zeus",
      "athena",
      "telemachus",
      "penelope",
      "antinous",
      "eurymachus",
    ]),
  );
});

test("Every book exposes a compact disclosed audio player without a duplicate pilot route", async () => {
  const reader = await fs.readFile("src/components/BookReader.astro", "utf8");
  const player = await fs.readFile(
    "src/components/BookAudioPlayer.astro",
    "utf8",
  );
  const manifest = await fs.readFile("src/data/audio/book-01.json", "utf8");

  assert.match(manifest, /Озвучено синтетическими голосами ИИ/u);
  assert.match(manifest, /book-01\.mp3/);
  assert.match(reader, /import\.meta\.glob/u);
  assert.match(reader, /<BookAudioPlayer/u);
  assert.match(reader, /\/audio\/books\//u);
  await assert.rejects(fs.access("src/pages/audio-pilot.astro"));
  assert.doesNotMatch(`${reader}\n${player}`, /\bautoplay\b/u);
  assert.doesNotMatch(player, /voiceCount/u);
  assert.doesNotMatch(player, /голосов/u);
  assert.match(player, /data-playback-rate/);
  assert.match(player, /playbackRate/);
  assert.match(player, /odyssey-audio-rate/u);
  assert.match(player, /duration \/ playbackRate/u);
  assert.match(player, /осталось/u);
  assert.match(player, /mediaSession/);
  assert.match(player, /setActionHandler/);
  assert.match(player, /odyssey-audio-position/);
  assert.match(player, /data-audio-next/u);
  assert.match(player, /nextLink\.hidden = false/u);
  assert.match(player, /nexttrack/u);
  assert.doesNotMatch(player, /visibilitychange[\s\S]{0,300}\.pause\(/u);
});

test("All 24 books have one publishable MP3 and a complete manifest", async () => {
  for (let book = 1; book <= 24; book += 1) {
    const number = String(book).padStart(2, "0");
    const file = await fs.readFile(`public/audio/books/book-${number}.mp3`);
    const manifest = JSON.parse(
      await fs.readFile(`src/data/audio/book-${number}.json`, "utf8"),
    );

    assert.ok(file.byteLength > 1_000_000, `Book ${number} MP3 is too small`);
    assert.equal(file.subarray(0, 3).toString(), "ID3");
    assert.equal(manifest.book, book);
    assert.equal(manifest.file, `book-${number}.mp3`);
    assert.ok(manifest.paragraphCount > 0);
    assert.ok(manifest.durationSeconds > 5 * 60);
  }
});
