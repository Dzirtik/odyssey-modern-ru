export const project = {
  title: "Одиссея: близко к тексту",
  owner: "Dzirtik",
  repository: "odyssey-modern-ru",
  version: "0.1.0-preview.1",
  publishedBooks: 1,
  publicationYear: 2026,
  lastChecked: "2026-07-24",
} as const;

export const withBase = (path: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}` || "/";
};
