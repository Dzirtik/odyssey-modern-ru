import { assert, readYaml, success } from "./lib.mjs";

const sources = await readYaml("src/data/sources.yml");
const required = [
  "id",
  "author",
  "title",
  "institution_or_publisher",
  "url",
  "accessed_at",
  "source_type",
  "language",
  "work_rights_status",
  "digital_object_rights_status",
  "allowed_use",
  "jurisdictions_checked",
  "confidence",
  "notes",
];
const ids = new Set();

assert(
  Array.isArray(sources) && sources.length > 0,
  "sources.yml must contain source cards",
);
for (const source of sources) {
  for (const field of required) {
    assert(
      field in source,
      `Source ${source.id ?? "(missing id)"} lacks ${field}`,
    );
  }
  assert(!ids.has(source.id), `Duplicate source id: ${source.id}`);
  ids.add(source.id);
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(source.accessed_at),
    `Invalid accessed_at for ${source.id}`,
  );
  assert(
    ["https:", "http:"].includes(new URL(source.url).protocol),
    `Invalid URL for ${source.id}`,
  );
  assert(
    source.work_rights_status !== "unknown",
    `Unknown work rights for ${source.id}`,
  );
  assert(
    source.digital_object_rights_status !== "unknown",
    `Unknown digital-object rights for ${source.id}`,
  );
}

success(`${sources.length} source cards validated`);
