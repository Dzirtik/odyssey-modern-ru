export const project = {
  title: "«Одиссея» Гомера: близко к тексту",
  shortTitle: "Одиссея",
  owner: "Dzirtik",
  repository: "odyssey-modern-ru",
  version: "0.3.0-preview.1",
  publishedBooks: 24,
  draftOutlineBooks: 0,
  publicationYear: 2026,
  firstPublished: "2026-07-24",
  lastChecked: "2026-07-24",
} as const;

export const withBase = (path: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}` || "/";
};
