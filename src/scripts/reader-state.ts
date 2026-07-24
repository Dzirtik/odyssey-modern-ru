export const READER_STATE_KEY = "odyssey-reader-state-v2";
export const READER_STATE_VERSION = 2;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ReaderState {
  version: typeof READER_STATE_VERSION;
  lastBook: number | null;
  lastPassage: string | null;
  maxCompletedBook: number;
}

const emptyState = (): ReaderState => ({
  version: READER_STATE_VERSION,
  lastBook: null,
  lastPassage: null,
  maxCompletedBook: 0,
});

const integerInRange = (
  value: unknown,
  minimum: number,
  maximum: number,
): number | null => {
  const number = typeof value === "number" ? value : Number.NaN;
  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : null;
};

export const validPassageId = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const match = value.match(/^lines-(\d+)-(\d+)$/);
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return Number.isInteger(start) && Number.isInteger(end) && end >= start;
};

export const parseReaderState = (raw: string | null): ReaderState | null => {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ReaderState>;
    if (value.version !== READER_STATE_VERSION) return null;
    const maxCompletedBook = integerInRange(value.maxCompletedBook, 0, 24);
    const lastBook =
      value.lastBook === null ? null : integerInRange(value.lastBook, 1, 24);
    const lastPassage =
      value.lastPassage === null
        ? null
        : validPassageId(value.lastPassage)
          ? value.lastPassage
          : null;
    if (
      maxCompletedBook === null ||
      (value.lastBook !== null && lastBook === null) ||
      (value.lastPassage !== null && lastPassage === null) ||
      (lastBook === null && lastPassage !== null)
    ) {
      return null;
    }
    return {
      version: READER_STATE_VERSION,
      lastBook,
      lastPassage,
      maxCompletedBook,
    };
  } catch {
    return null;
  }
};

const browserStorage = (): StorageLike | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const legacyState = (): ReaderState => {
  // The previous schema treated a route visit as reading. Neither its resume
  // point nor its completion limit is trusted as evidence of reader intent.
  return emptyState();
};

export const readReaderState = (
  storage: StorageLike | null = browserStorage(),
): ReaderState => {
  if (!storage) return emptyState();
  try {
    const current = parseReaderState(storage.getItem(READER_STATE_KEY));
    if (current) return current;
    const migrated = legacyState();
    storage.setItem(READER_STATE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return emptyState();
  }
};

const writeReaderState = (
  state: ReaderState,
  storage: StorageLike | null = browserStorage(),
) => {
  if (!storage) return false;
  try {
    storage.setItem(READER_STATE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const saveReaderPosition = (
  book: number,
  passage: string,
  storage: StorageLike | null = browserStorage(),
) => {
  const safeBook = integerInRange(book, 1, 24);
  if (safeBook === null || !validPassageId(passage))
    return readReaderState(storage);
  const state = readReaderState(storage);
  if (state.lastBook === safeBook && state.lastPassage === passage)
    return state;
  const next = { ...state, lastBook: safeBook, lastPassage: passage };
  writeReaderState(next, storage);
  return next;
};

export const completeBook = (
  book: number,
  storage: StorageLike | null = browserStorage(),
) => {
  const safeBook = integerInRange(book, 1, 24);
  const state = readReaderState(storage);
  if (safeBook === null || safeBook !== state.maxCompletedBook + 1)
    return state;
  const next = { ...state, maxCompletedBook: safeBook };
  writeReaderState(next, storage);
  return next;
};

export const resetReaderState = (
  storage: StorageLike | null = browserStorage(),
) => {
  if (!storage) return;
  try {
    storage.removeItem(READER_STATE_KEY);
    storage.removeItem("odyssey-last-book");
    storage.removeItem("odyssey-max-book");
    for (let book = 1; book <= 24; book += 1) {
      storage.removeItem(
        `odyssey-progress-book-${String(book).padStart(2, "0")}`,
      );
    }
  } catch {
    // A blocked storage backend leaves the safe in-memory default in effect.
  }
};

export const readNumberPreference = (
  key: string,
  fallback: number,
  minimum: number,
  maximum: number,
  storage: StorageLike | null = browserStorage(),
) => {
  if (!storage) return fallback;
  try {
    const value = Number(storage.getItem(key));
    return Number.isFinite(value) && value >= minimum && value <= maximum
      ? value
      : fallback;
  } catch {
    return fallback;
  }
};

export const writePreference = (
  key: string,
  value: string,
  storage: StorageLike | null = browserStorage(),
) => {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Reading remains functional when storage is unavailable.
  }
};
