import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export const root = process.cwd();

export async function readYaml(relativePath) {
  const source = await fs.readFile(path.join(root, relativePath), "utf8");
  return YAML.parse(source);
}

export async function readText(relativePath) {
  return fs.readFile(path.join(root, relativePath), "utf8");
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function success(message) {
  console.log(`✓ ${message}`);
}
