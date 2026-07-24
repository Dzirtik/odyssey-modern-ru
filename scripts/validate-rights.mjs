import { assert, readYaml, success } from "./lib.mjs";

const assets = await readYaml("src/data/rights.yml");
const sources = await readYaml("src/data/sources.yml");
const sourceIds = new Set(sources.map((source) => source.id));
const required = [
  "asset_id",
  "path_or_url",
  "creator",
  "title",
  "asset_type",
  "source_id",
  "rights_holder",
  "status",
  "license",
  "license_url",
  "attribution_required",
  "attribution_text",
  "modifications_allowed",
  "commercial_use_allowed",
  "proof_or_basis",
  "verified_at",
  "verified_by",
];
const ids = new Set();

for (const asset of assets) {
  for (const field of required)
    assert(
      field in asset,
      `Rights entry ${asset.asset_id ?? "(missing id)"} lacks ${field}`,
    );
  assert(!ids.has(asset.asset_id), `Duplicate asset id: ${asset.asset_id}`);
  ids.add(asset.asset_id);
  assert(
    asset.status !== "unknown",
    `Published asset ${asset.asset_id} has unknown rights`,
  );
  assert(
    !asset.source_id || sourceIds.has(asset.source_id),
    `Unknown source ${asset.source_id} in ${asset.asset_id}`,
  );
  if (asset.attribution_required)
    assert(
      asset.attribution_text.trim(),
      `Missing attribution for ${asset.asset_id}`,
    );
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(asset.verified_at),
    `Invalid rights verification date for ${asset.asset_id}`,
  );
}

for (const requiredAsset of [
  "odyssey_ancient_work",
  "perseus_grc1_digital_object",
  "original_russian_preview",
  "site_code",
]) {
  assert(
    ids.has(requiredAsset),
    `Missing published asset rights entry: ${requiredAsset}`,
  );
}

success(
  `${assets.length} rights entries validated; no unknown published assets`,
);
