import fs from "node:fs/promises";
import YAML from "yaml";

const people = YAML.parse(
  await fs.readFile(new URL("../src/data/people.yml", import.meta.url), "utf8"),
);
const glossary = YAML.parse(
  await fs.readFile(
    new URL("../src/data/glossary.yml", import.meta.url),
    "utf8",
  ),
);

const errors = [];
const normalize = (value) =>
  String(value).trim().toLocaleLowerCase("ru-RU").replace(/\s+/g, " ");

const validateUnique = (records, field, label) => {
  const seen = new Set();
  for (const record of records) {
    const value = normalize(record[field]);
    if (!value) errors.push(`${label}: empty ${field}.`);
    if (seen.has(value))
      errors.push(`${label}: duplicate ${field} "${value}".`);
    seen.add(value);
  }
};

validateUnique(people, "name", "People");
validateUnique(glossary, "term", "Glossary");

for (const person of people) {
  if (
    !Number.isInteger(person.first_book) ||
    person.first_book < 1 ||
    person.first_book > 24
  ) {
    errors.push(`Person "${person.name}": invalid first_book.`);
  }
  if (!Array.isArray(person.aliases)) {
    errors.push(`Person "${person.name}": aliases must be an array.`);
  }
  if (!person.type || String(person.description ?? "").length < 45) {
    errors.push(`Person "${person.name}": incomplete type or description.`);
  }
}

for (const entry of glossary) {
  if (
    !Number.isInteger(entry.first_book) ||
    entry.first_book < 1 ||
    entry.first_book > 24
  ) {
    errors.push(`Glossary "${entry.term}": invalid first_book.`);
  }
  if (!entry.category || String(entry.definition ?? "").length < 45) {
    errors.push(`Glossary "${entry.term}": incomplete category or definition.`);
  }
}

const requiredPeople = [
  "Одиссей",
  "Телемах",
  "Пенелопа",
  "Афина",
  "Зевс",
  "Посейдон",
  "Гермес",
  "Калипсо",
  "Полифем",
  "Нестор",
  "Менелай",
  "Елена",
  "Навсикая",
  "Алкиной",
  "Арета",
  "Кирка",
  "Тиресий",
  "Евмей",
  "Евриклея",
  "Лаэрт",
  "Антиной",
  "Евримах",
  "Филойтий",
];
const peopleNames = new Set(people.map((person) => person.name));
for (const name of requiredPeople) {
  if (!peopleNames.has(name)) errors.push(`Missing core person "${name}".`);
}

const requiredTerms = [
  "Ксения",
  "Клеос",
  "Ностос",
  "Ойкос",
  "Аэд",
  "Форминга",
  "Фемида",
  "Гекатомба",
  "Асаминт",
  "Циклопы",
  "Метис",
  "Психе",
  "Некия",
  "Сирены",
  "Скилла",
  "Харибда",
];
const glossaryTerms = new Set(glossary.map((entry) => entry.term));
for (const term of requiredTerms) {
  if (!glossaryTerms.has(term)) errors.push(`Missing core term "${term}".`);
}

const serialized = JSON.stringify({ people, glossary }).toLocaleLowerCase(
  "ru-RU",
);
if (serialized.includes("циклон")) {
  errors.push('Reference data must not confuse "циклоп" with "циклон".');
}
if (people.length < 90) {
  errors.push(`People registry is unexpectedly small: ${people.length}.`);
}
if (glossary.length < 45) {
  errors.push(`Glossary is unexpectedly small: ${glossary.length}.`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `${people.length} people/creatures and ${glossary.length} glossary entries validated.`,
);
