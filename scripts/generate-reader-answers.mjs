import fs from "node:fs/promises";
import prettier from "prettier";
import YAML from "yaml";

const numberWords = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty-one",
  "twenty-two",
  "twenty-three",
  "twenty-four",
];

const stopwords = new Set([
  "почему",
  "зачем",
  "какой",
  "какая",
  "какие",
  "каково",
  "когда",
  "откуда",
  "куда",
  "здесь",
  "такое",
  "такой",
  "такая",
  "этот",
  "этого",
  "этой",
  "между",
  "может",
  "могут",
  "нужно",
  "сразу",
  "перед",
  "после",
  "себя",
  "своего",
  "своей",
  "своим",
  "становится",
  "называется",
  "назван",
  "названа",
]);

const manualAnswers = {
  "Почему жертвы создают ожидание взаимности?": {
    summary:
      "Афина напоминает о жертвах Одиссея как о прежних знаках почтения богам и основании просить ответной благосклонности.",
    details:
      "В гомеровской религиозной логике жертва поддерживает отношения взаимности между смертным и божеством, но не связывает бога договором и не гарантирует награду. Поэтому аргумент Афины усиливает просьбу к Зевсу, не превращая возвращение Одиссея в обязательную плату.",
    confidence: "established",
    sourceIds: [
      "homer_odyssey_perseus_grc2",
      "de_jong_2001",
      "cambridge_guide_homeric_religion_2020",
    ],
  },
  "Что такое наследственное гостеприимство?": {
    summary:
      "Ксения связывает не только двух бывших гостей, но и их дома: потомки могут признавать и продолжать отношения, установленные отцами.",
    details:
      "Телемах спрашивает, принимал ли Одиссей этого человека прежде, потому что прежний обмен приёмом и дарами создаёт долговременную связь между семьями. Это не безличная гостиничная услуга, а взаимное обязательство защиты, памяти и будущего приёма.",
    confidence: "established",
    sourceIds: [
      "homer_odyssey_perseus_grc2",
      "de_jong_2001",
      "britannica_xenia",
    ],
  },
  "Почему Пенелопа подчиняется?": {
    summary:
      "Пенелопа уходит не потому, что признала доводы женихов, а потому, что Телемах впервые публично заявляет власть взрослого мужчины в доме.",
    details:
      "Повествование подчёркивает её удивление словам сына. Сцена показывает изменение положения Телемаха внутри гендерно и иерархически устроенного ойкоса; она не доказывает, что Пенелопа лишена собственной стратегии или внутренне согласна со всем сказанным.",
    confidence: "probable",
    sourceIds: [
      "homer_odyssey_perseus_grc2",
      "de_jong_2001",
      "petropoulos_2011_telemachus",
    ],
  },
  "Что значит «самая новая песня»?": {
    summary:
      "Телемах говорит о песне, предмет которой воспринимается слушателями как самый свежий и близкий к их настоящему опыт.",
    details:
      "Фемий поёт о недавних возвращениях ахейцев из Трои, поэтому рассказ особенно болезнен Пенелопе и особенно привлекателен публике. Формула не позволяет датировать исполнение или утверждать, что певец только что сочинил произведение целиком.",
    confidence: "probable",
    sourceIds: [
      "homer_odyssey_perseus_grc2",
      "de_jong_2001",
      "nagy_odyssey_rhapsody_1",
    ],
  },
  "Зачем скрывать путь от Пенелопы?": {
    summary:
      "Телемах стремится избежать немедленного запрета и заранее оградить мать от тревоги, пока исход плавания неизвестен.",
    details:
      "Тайна одновременно показывает его новую самостоятельность и ограниченность этой самостоятельности: для пути ему всё ещё нужны помощь Афины, корабль, команда, припасы Евриклеи и её клятва молчать. Мотив не означает разрыва с матерью.",
    confidence: "established",
    sourceIds: ["homer_odyssey_perseus_grc2", "de_jong_2001"],
  },
  "Разбой считался обычным?": {
    summary:
      "Морской набег был узнаваемой возможностью, поэтому Нестор может прямо спросить гостей, не пираты ли они; это не делает насилие нравственно нейтральным.",
    details:
      "В эпическом мире торговля, путешествие и вооружённый набег могут совершаться одними и теми же группами. Вопрос выясняет статус и намерения прибывших до установления доверия, а не выражает современную юридическую квалификацию пиратства.",
    confidence: "probable",
    sourceIds: [
      "homer_odyssey_perseus_grc2",
      "de_jong_2001",
      "cambridge_guide_odyssey_overview_2020",
    ],
  },
  "Где был Менелай?": {
    summary:
      "В этих строках Телемах только ставит вопрос: известно лишь, что Менелая не было рядом с Агамемноном; причину отсутствия Нестор ещё не сообщил.",
    details:
      "Телемах предполагает, что присутствие Менелая могло бы изменить соотношение сил, и просит объяснить его отсутствие. Подробный ответ должен появиться только вместе со следующими строками рассказа Нестора.",
    confidence: "established",
    sourceIds: ["homer_odyssey_perseus_grc2", "de_jong_2001"],
  },
  "Где он странствовал?": {
    summary:
      "В этом диапазоне Менелай сообщает только длительность — восемь лет странствий; конкретные земли поэма здесь ещё не перечислила.",
    details:
      "Поэтому сейчас нельзя достраивать маршрут из последующих строк или современной карты. Подробный перечень появится тогда, когда его назовёт сам Менелай.",
    confidence: "probable",
    sourceIds: ["homer_odyssey_perseus_grc2", "de_jong_2001"],
  },
  "Что даст путешествие, если отец далеко?": {
    summary:
      "Плавание должно дать Телемаху проверяемые сведения об Одиссее и вывести его из пассивного положения внутри захваченного женихами дома.",
    details:
      "Афина направляет его к Нестору и Менелаю — участникам войны и возвращений. Даже если отец не найден, публичное выступление, путь и встречи создают Телемаху собственное доброе имя и опыт действия; это самостоятельный результат поездки.",
    confidence: "established",
    sourceIds: [
      "homer_odyssey_perseus_grc2",
      "de_jong_2001",
      "petropoulos_2011_telemachus",
    ],
  },
  "Кто такие женихи?": {
    summary:
      "Женихи — знатные мужчины Итаки и соседних островов, добивающиеся брака с Пенелопой, пока судьба Одиссея неизвестна.",
    details:
      "Они постоянно собираются в доме отсутствующего хозяина и потребляют его скот, вино и хлеб. Поэтому их присутствие является не только брачным соперничеством, но и длительным присвоением ресурсов ойкоса, наследником которого остаётся Телемах.",
    confidence: "established",
    sourceIds: ["homer_odyssey_perseus_grc2", "de_jong_2001"],
  },
};

const summaryOverrides = {
  "Что произошло в Трое?":
    "До начала «Одиссеи» ахейцы после десятилетней войны взяли и разрушили Трою; поэма считает этот общий фон известным и начинает рассказ уже с возвращения победителей.",
  "Почему Одиссей не может уйти?":
    "Калипсо удерживает Одиссея на удалённом острове, а у него нет ни корабля, ни команды; уйти он сможет лишь после решения богов и появления средств для плавания.",
  "Почему боги обсуждают другой дом?":
    "История дома Агамемнона служит Зевсу примером человеческой ответственности: Эгисф действовал вопреки предупреждению, поэтому нельзя всякую беду приписывать только богам.",
  "Почему дым родной земли так важен?":
    "Дым обозначает не достопримечательность, а сам видимый дом и человеческую принадлежность: Одиссей предпочитает смертную Итаку бессмертной жизни вдали от своих.",
  "Когда и почему Одиссей ослепил Полифема?":
    "К этому месту известно только, что Одиссей ослепил циклопа Полифема и тем вызвал гнев его отца Посейдона; обстоятельства поэма пока намеренно не рассказывает.",
  "Что показывает расположение кресел?":
    "Телемах усаживает гостя отдельно от женихов и рядом с собой: расположение защищает частный разговор и подчёркивает, что гость не принадлежит к разоряющей дом компании.",
  "Кто организует пир?":
    "Пир поддерживает весь домашний персонал: глашатаи, служанка, ключница, резчик мяса и виночерпий выполняют разные работы, хотя ресурсы принадлежат ойкосу Одиссея.",
  "Почему певец не может отказаться?":
    "Повествователь уже называет пение Фемия вынужденным: певец зависит от женихов, которые заняли зал и распоряжаются пиром, поэтому его выступление не равно свободному согласию.",
  "Что значит внешнее сходство?":
    "Сходство с отцом позволяет окружающим предположить родство, но не служит доказательством само по себе; Телемах потому и отделяет чужое наблюдение от собственного знания.",
  "Насколько словам Мента можно верить?":
    "Читатель знает, что под именем Мента говорит Афина: часть биографических деталей создаёт правдоподобную маску, а обещание возвращения выражает божественное знание, недоступное Телемаху.",
  "Что наследует сын кроме имущества?":
    "Сын наследует имя дома, общественные ожидания, обязанность защищать близких и память об отце; поэтому kleos и способность действовать здесь не менее важны, чем вещи.",
  "Кому принадлежит имущество?":
    "Это имущество ойкоса Одиссея, наследником которого остаётся Телемах; женихи пользуются запасами без согласия хозяина и потому изображены не законными совладельцами, а разорителями.",
  "Кто имеет право говорить?":
    "Перед собранием говорит тот, кому глашатай передал скипетр и кого община признала выступающим; скипетр обозначает временное право на публичную речь, а не единоличную власть.",
  "Почему он плачет публично?":
    "Телемах превращает личное горе в довод перед общиной: слёзы показывают реальность ущерба и одновременно отмечают первый публичный выход сына Одиссея.",
  "Это угроза или молитва?":
    "Это проклятие в форме религиозного обращения: Телемах призывает Эриний наказать его, если он несправедливо изгонит мать, и тем превращает возможный поступок в опасное нарушение.",
  "Что именно делают орлы?":
    "Два орла летят рядом справа, кружат над собранием, рвут друг другу щёки и шеи когтями, а затем уходят вправо над городом; именно эта последовательность требует толкования.",
  "Можно ли хоронить человека без тела?":
    "Да: можно совершить поминальные обряды и насыпать пустой курган-кенотаф, если тело недоступно; такой памятник даёт умершему общественную честь и сохраняет имя.",
  "Почему он готов ждать ещё год?":
    "Если свидетели сообщат, что Одиссей жив, Телемах готов терпеть ещё двенадцать месяцев; если подтвердится смерть, он совершит погребальные обряды и позволит матери вступить в новый брак.",
  "Откуда взялся мотив яда?":
    "Мотив входит в вымышленную биографию Мента: под этим предлогом Афина объясняет морское путешествие к Эфире и одновременно делает маску торговца правдоподобной.",
  "Кому достанется дом?":
    "Женихи предполагают, что после гибели Телемаха разделят его движимое имущество и оставят дом тому, кто женится на Пенелопе; это их план, а не признанное законное решение.",
  "Почему быки чёрные?":
    "Поэма отмечает чёрную масть жертвенных быков, но не объясняет выбор цвета; связывать его с Посейдоном или «подземным» культом как с твёрдым правилом было бы сильнее свидетельства.",
  "Что означает каменное сиденье?":
    "Это почётное место Нелея, основателя династии: посадив туда Телемаха, Нестор включает гостя в пространство семейной памяти и подчёркивает высокий статус приёма.",
  "Сколько занимает дорога до Спарты?":
    "Путь на колеснице занимает два дня: первую ночь путники проводят у Диокла в Ферах, а на следующий день достигают Лакедемона и дома Менелая.",
  "Почему просьба повторяет слова к Нестору?":
    "Телемах повторяет формулу, потому что задаёт второму свидетелю тот же главный вопрос о судьбе отца; повтор связывает визиты в Пилос и Спарту как этапы одного расследования.",
  "Почему богатство не радует Менелая?":
    "Богатство добыто ценой долгих скитаний и не возмещает погибших под Троей; особенно Менелая мучает неизвестная судьба Одиссея, поэтому роскошь постоянно напоминает об утрате.",
  "Где эрембы?":
    "Надёжно отождествить землю эрембов на современной карте нельзя; у Менелая это один из дальних пунктов эпического перечня рядом с Египтом, Эфиопией, Сидоном и Ливией.",
  "Почему гостей сначала моют?":
    "Омовение снимает усталость и дорожную грязь и входит в упорядоченный приём чужеземца: хозяин обеспечивает телесную безопасность и пищу прежде, чем требует рассказа.",
  "Почему бог скрывается?":
    "Здесь скрывается не Протей, а люди: Эйдофея маскирует Менелая и спутников под тюленей, чтобы они смогли приблизиться к морскому старцу и удержать его.",
  "Как можно держать воду?":
    "Протей принимает облик текущей воды, но спутники продолжают держать его как того же меняющего форму бога; сцена подчиняется мифологической, а не физической логике.",
  "Где они устроят засаду?":
    "Женихи выбирают пролив между Итакой и Самой и караулят у небольшого острова Астерис с двумя удобными гаванями.",
  "Почему совет повторяется?":
    "Второй совет возвращает повествование от Телемаха к Одиссею и переводит решение первой песни в действие: теперь Гермес должен передать Калипсо приказ отпустить героя.",
  "Знают ли боги о засаде?":
    "Да. Афина прямо напоминает Зевсу, что женихи вышли в море и устроили засаду Телемаху на пути домой.",
  "Почему боги не перевозят его сами?":
    "Таков объявленный Зевсом порядок возвращения: Одиссей сам строит средство плавания и достигает феаков, а они доставляют гостя домой; отдельной причины такого ограничения поэма не даёт.",
  "Где Огигия?":
    "Огигия — удалённый мифический остров Калипсо; поэма подчёркивает его изоляцию, но не даёт координат, позволяющих уверенно поместить его на современную карту.",
  "Почему Калипсо ткёт?":
    "Ткачество показывает обычную деятельность хозяйки божественного дома и делает пещеру обжитым пространством; отдельного сюжетного мотива для работы поэма не сообщает.",
  "Почему Одиссей не в пещере?":
    "Он сидит на берегу, плачет и смотрит в сторону моря: близость к дому Калипсо не означает согласия остаться, а берег выражает его постоянное стремление уйти.",
  "Может ли он уйти?":
    "Пока нет: у Одиссея нет корабля и команды, а Калипсо удерживает его; после приказа Зевса она должна дать материалы и припасы, но строить и плыть он будет сам.",
  "Что именно он должен построить?":
    "Он строит не полноценный военный корабль, а большой связанный плот с настилом, бортами, мачтой, парусом и рулевым веслом, рассчитанный на одного морехода и припасы.",
  "Как он отвечает без оскорбления?":
    "Одиссей признаёт бессмертие и красоту Калипсо, не сравнивая их с Пенелопой на равных, но ясно говорит, что всё равно выбирает возвращение к смертной жене и дому.",
  "Как он не спит?":
    "Поэма приписывает Одиссею семнадцать суток непрерывного управления плотом по звёздам; реалистического режима сна она не описывает, поэтому это следует читать как меру эпической выносливости.",
  "Кто Ино?":
    "Ино, теперь называемая Левкотеей, — бывшая смертная и морская богиня; она жалеет Одиссея и даёт покрывало, которое должно удержать его на воде.",
  "Как река отвечает?":
    "Река отвечает действием, а не речью: после молитвы Одиссея божество останавливает течение и волну, создавая спокойный выход на берег.",
  "Может ли он идти?":
    "Почти нет: Одиссей выбирается из воды, возвращает покрывало Ино и падает без сил; дальше он движется медленно, пытаясь найти укрытие.",
  "Почему он не остаётся у реки?":
    "На открытом берегу ему угрожают ночной холод, сырость и возможный новый подъём воды, поэтому он ищет защищённое место под кустами в ближайшем лесу.",
};

const normalize = (value) =>
  value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/[«»“”„"'`]/g, "")
    .replace(/[?.!,:;—–-]+$/g, "")
    .replace(/\s+/g, " ");

const people = YAML.parse(await fs.readFile("src/data/people.yml", "utf8"));
const glossary = YAML.parse(await fs.readFile("src/data/glossary.yml", "utf8"));

const questionStems = (question) =>
  normalize(question)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 4 && !stopwords.has(word))
    .map((word) => word.slice(0, Math.min(5, word.length)));

const ensureSentence = (value) => {
  const text = String(value ?? "").trim();
  return !text || /[.!?]$/.test(text) ? text : `${text}.`;
};

const classifyLayer = (question) => {
  if (
    /жертв|гостепр|пир|брак|раб|зависим|вино|скипетр|гекатомб|обыч|обряд|молит|торгов|имуще|власт|погреб|клятв|прориц|знамени|омыв|ванн|asaminthos|электр|дары/iu.test(
      question,
    )
  ) {
    return "POEM_WORLD + ARCHAIC_CONTEXT";
  }
  if (
    /вступлен|песн|эпос|рассказ|сравнен|сходств|означ|значит|образ|повтор|повествовател/iu.test(
      question,
    )
  ) {
    return "POEM_WORLD + MODERN_HYPOTHESIS";
  }
  return "POEM_WORLD";
};

const definitionMatches = (question, bookNumber) => {
  const explicitDefinition =
    /^(кто\s+так\p{L}*|что\s+так\p{L}*|что\s+означ\p{L}*|что\s+значит)(?:\s|$)/iu.test(
      question,
    );
  const directNamedPerson = /^кто\s+[А-ЯЁ]/iu.test(question);
  if (!explicitDefinition && !directNamedPerson) {
    return [];
  }
  const normalizedQuestion = normalize(question);
  const matches = [];

  for (const person of people) {
    if (Number(person.first_book) > bookNumber) continue;
    const labels = [
      person.name,
      ...(explicitDefinition || directNamedPerson
        ? (person.aliases ?? [])
        : []),
    ]
      .map((label) => normalize(String(label)))
      .filter((label) => label.length >= 4);
    if (labels.some((label) => normalizedQuestion.includes(label))) {
      matches.push({
        label: person.name,
        definition: person.description,
        kind: "person",
      });
    }
  }

  for (const entry of glossary) {
    if (Number(entry.first_book) > bookNumber) continue;
    const labels = [entry.term, entry.greek]
      .filter(Boolean)
      .map((label) => normalize(String(label)));
    if (
      labels.some((label) => {
        const root = label.replace(/[ыиаеяьй]$/u, "");
        return (
          normalizedQuestion.includes(label) ||
          (root.length >= 4 && normalizedQuestion.includes(root))
        );
      })
    ) {
      matches.push({
        label: entry.term,
        definition: entry.definition,
        kind: "term",
      });
    }
  }

  const unique = new Map();
  for (const match of matches) {
    const key = normalize(match.label);
    if (!unique.has(key)) unique.set(key, match);
  }
  return [...unique.values()];
};

const sentencesFrom = (passage) => {
  const text = passage.paragraphs.join(" ");
  return (
    text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()) ?? []
  );
};

const usefulCause = (value) => {
  const text = String(value ?? "").trim();
  if (!text || text.startsWith("Последовательность сохранена")) return "";
  return text;
};

const usefulAmbiguities = (values) =>
  (values ?? [])
    .map((value) => String(value).trim())
    .filter(
      (value) =>
        value &&
        !value.startsWith(
          "Лексика и формульные выражения требуют независимой человеческой",
        ),
    );

const selectEvidence = (question, passage) => {
  const stems = questionStems(question);
  const sentences = sentencesFrom(passage);
  const normalizedQuestion = normalize(question);
  const ranked = sentences
    .map((sentence, index) => {
      const normalized = normalize(sentence);
      const score = stems.reduce(
        (sum, stem) => sum + (normalized.includes(stem) ? 1 : 0),
        0,
      );
      const questionEcho =
        normalized === normalizedQuestion ||
        (sentence.trim().endsWith("?") &&
          normalized.includes(normalizedQuestion));
      return {
        sentence,
        index,
        score: questionEcho ? score - 10 : score,
        questionEcho,
      };
    })
    .sort(
      (left, right) => right.score - left.score || left.index - right.index,
    );
  const best = ranked[0] ?? { sentence: "", index: 0, score: 0 };
  const next =
    sentences[best.index + 1] && sentences[best.index + 1] !== best.sentence
      ? sentences[best.index + 1]
      : "";
  return {
    primary: best.sentence || sentences[0] || "",
    primaryIsQuestion: best.sentence.trim().endsWith("?"),
    secondary:
      ranked.find(
        (item) =>
          item.index !== best.index &&
          item.score > 0 &&
          !item.sentence.trim().endsWith("?"),
      )?.sentence ??
      next ??
      "",
  };
};

const composeAnswer = ({ question, passage, segment, bookNumber }) => {
  if (manualAnswers[question]) return manualAnswers[question];
  const evidence = selectEvidence(question, passage);
  const cause = usefulCause(segment.cause_and_effect);
  const ambiguities = usefulAmbiguities(segment.ambiguities);
  const asksCause = /^(почему|зачем|как)(?:\s|$)/iu.test(question);
  const asksDefinition = /^(кто|что|где)(?:\s|$)/iu.test(question);
  const asksClosedQuestion =
    /^(может|могут|можно|знает|знают|верит|видит|одобряет|это|разве|все ли|насколько)(?:\s|$)/iu.test(
      question,
    );
  const stems = questionStems(question);
  const definitions = definitionMatches(question, bookNumber);
  const causeIsRelevant = stems.some((stem) => normalize(cause).includes(stem));
  const relevantAmbiguities = ambiguities.filter((ambiguity) => {
    const normalized = normalize(ambiguity);
    return asksDefinition || stems.some((stem) => normalized.includes(stem));
  });

  const summaryParts = [];
  if (definitions.length > 0) {
    summaryParts.push(
      definitions
        .map(
          ({ label, definition }) =>
            `${label} — ${String(definition).replace(/[.]$/u, "")}.`,
        )
        .join(" "),
    );
  } else if (evidence.primaryIsQuestion) {
    summaryParts.push(
      `В строках ${passage.lines} поэма формулирует этот вопрос, но ещё не сообщает окончательный ответ.`,
    );
  } else if (asksCause && causeIsRelevant) {
    summaryParts.push(ensureSentence(cause));
  } else if (asksCause && relevantAmbiguities.length > 0) {
    summaryParts.push(
      `Поэма не сводит это место к одной бесспорной причине. ${ensureSentence(
        relevantAmbiguities[0],
      )}`,
    );
  } else if (asksCause) {
    summaryParts.push(
      `Поэма не формулирует отдельной причины; доступное в этом месте основание дано самой сценой. ${ensureSentence(
        evidence.primary,
      )}`,
    );
  } else if (asksClosedQuestion) {
    summaryParts.push(
      `По сведениям, доступным в этой точке рассказа: ${ensureSentence(
        evidence.primary,
      )}`,
    );
  } else {
    if (evidence.primary) summaryParts.push(ensureSentence(evidence.primary));
  }
  if (!asksCause && !asksDefinition && !asksClosedQuestion && causeIsRelevant) {
    summaryParts.push(ensureSentence(cause));
  }

  const detailsParts = [];
  if (evidence.secondary) detailsParts.push(ensureSentence(evidence.secondary));
  if (
    cause &&
    !summaryParts.some((part) => normalize(part).includes(normalize(cause)))
  ) {
    detailsParts.push(ensureSentence(cause));
  }
  if (relevantAmbiguities.length > 0) {
    detailsParts.push(
      `Важно сохранить оговорку этого места: ${relevantAmbiguities
        .map(ensureSentence)
        .join(" ")}`,
    );
  }
  detailsParts.push(
    `Ответ ограничен сведениями, открытыми в строках ${passage.lines}; дальнейшие эпизоды здесь не привлекаются.`,
  );

  if (summaryParts.join(" ").length < 60 && cause) {
    summaryParts.push(cause);
  }
  if (detailsParts.join(" ").length < 120 && evidence.primary) {
    detailsParts.unshift(evidence.primary);
  }

  return {
    summary: summaryOverrides[question] ?? [...new Set(summaryParts)].join(" "),
    details: [...new Set(detailsParts)].join(" "),
    confidence: relevantAmbiguities.length > 0 ? "probable" : "established",
  };
};

await fs.mkdir("src/data/reader-answers", { recursive: true });
let generatedCount = 0;

for (let index = 0; index < numberWords.length; index += 1) {
  const bookNumber = index + 1;
  const padded = String(bookNumber).padStart(2, "0");
  const module = await import(`../src/data/book-${numberWords[index]}.ts`);
  const book = Object.values(module).find(
    (value) =>
      value &&
      typeof value === "object" &&
      value.book === bookNumber &&
      Array.isArray(value.passages),
  );
  const semanticMap = YAML.parse(
    await fs.readFile(`editorial/semantic-map/book-${padded}.yml`, "utf8"),
  );
  const answers = [];

  for (const passage of book.passages) {
    const range = `${passage.lineStart}-${passage.lineEnd}`;
    const segment = (semanticMap.segments ?? []).find(
      (item) => String(item.lines) === range,
    );
    if (!segment) continue;

    for (const [questionIndex, rawQuestion] of (
      segment.reader_questions ?? []
    ).entries()) {
      const question = String(rawQuestion).trim();
      const existingNote = (book.notes ?? []).find(
        (note) =>
          note.anchor === passage.id &&
          normalize(note.title) === normalize(question),
      );
      if (existingNote) continue;

      const answer = composeAnswer({
        question,
        passage,
        segment,
        bookNumber,
      });
      answers.push({
        answer_id: `reader-${padded}-${passage.id}-q${questionIndex + 1}`,
        book: bookNumber,
        anchor: passage.id,
        lines: passage.lines,
        line_start: passage.lineStart,
        line_end: passage.lineEnd,
        question,
        summary: answer.summary,
        details: answer.details,
        layer: classifyLayer(question),
        confidence: answer.confidence,
        reveal_at_book: bookNumber,
        reveal_at_line: passage.lineEnd,
        requires_progress_book: bookNumber,
        requires_progress_line: passage.lineEnd,
        spoiler_level: "safe",
        provenance: "automated_passage_bound_editorial_synthesis",
        human_reviewed: false,
        source_ids: answer.sourceIds ?? [
          "homer_odyssey_perseus_grc2",
          "de_jong_2001",
        ],
      });
      generatedCount += 1;
    }
  }

  const serialized = await prettier.format(YAML.stringify(answers), {
    parser: "yaml",
  });
  await fs.writeFile(`src/data/reader-answers/book-${padded}.yml`, serialized);
}

console.log(`Generated ${generatedCount} passage-bound reader answers.`);
