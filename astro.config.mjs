import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const repository =
  process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "odyssey-modern-ru";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  site: "https://dzirtik.github.io",
  base: isGitHubPages ? `/${repository}` : "/",
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/404.html"),
    }),
  ],
});
