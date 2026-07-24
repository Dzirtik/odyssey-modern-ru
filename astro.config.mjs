import { defineConfig } from "astro/config";

const repository =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "odyssey-modern-ru";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  site: "https://dzirtik.github.io",
  base: isGitHubPages ? `/${repository}` : "/",
  output: "static",
  trailingSlash: "always",
});
