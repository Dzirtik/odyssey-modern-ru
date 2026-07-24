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

test("Book I exposes the disclosed full audio edition without a duplicate pilot route", async () => {
  const reader = await fs.readFile("src/components/BookReader.astro", "utf8");
  const player = await fs.readFile(
    "src/components/BookAudioPlayer.astro",
    "utf8",
  );
  const manifest = await fs.readFile("src/data/audio/book-01.json", "utf8");

  assert.match(manifest, /Озвучено синтетическими голосами ИИ/u);
  assert.match(manifest, /book-01\.mp3/);
  assert.match(reader, /book\.book === 1/u);
  assert.match(reader, /<BookAudioPlayer/u);
  assert.match(reader, /\/audio\/books\//u);
  await assert.rejects(fs.access("src/pages/audio-pilot.astro"));
  assert.doesNotMatch(`${reader}\n${player}`, /\bautoplay\b/u);
  assert.match(player, /data-playback-rate/);
  assert.match(player, /playbackRate/);
  assert.match(player, /mediaSession/);
  assert.match(player, /setActionHandler/);
  assert.match(player, /odyssey-audio-position/);
  assert.doesNotMatch(player, /visibilitychange[\s\S]{0,300}\.pause\(/u);
});

test("Book I is one publishable MP3 with a complete manifest", async () => {
  const file = await fs.readFile("public/audio/books/book-01.mp3");
  const manifest = JSON.parse(
    await fs.readFile("src/data/audio/book-01.json", "utf8"),
  );

  assert.ok(file.byteLength > 1_000_000);
  assert.equal(file.subarray(0, 3).toString(), "ID3");
  assert.equal(manifest.book, 1);
  assert.equal(manifest.file, "book-01.mp3");
  assert.equal(manifest.paragraphCount, 62);
  assert.equal(Object.keys(manifest.voices).length, 7);
  assert.ok(manifest.durationSeconds > 20 * 60);
});
