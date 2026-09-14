const $ = (selector) => document.querySelector(selector);

const ENTRY_KEY = "apogey-entries";
const THEME_KEY = "apogey-theme";

const prompts = [
"Что заставляет меня с радостью вставать по утрам?",
"Если бы у меня было сколько угодно денег и времени, чем бы я занимался?",
"Чего я боюсь?",
"Что мне нужно перестать делать, а что - начать?",
"Что из прошлого мне нужно отпустить?",
"Люблю ли я себя? Что мне нужно сделать, чтобы полюбить себя безоговорочно?",
"Что для меня означает 'успех'?",
"Чего я на самом деле хочу от жизни? Не того, чего, по мнению семьи, друзей или общества, я должен хотеть, а именно того, чего хочу я?",
"Каковы три мои главные сильные стороны? Над чем тремя мне стоит поработать?",
"Я горжусь собой за то, что ___",
"Что у меня есть сейчас из того, о чем я мечтал много лет назад?",
"Не держусь ли я за то, что приносит мне больше вреда, чем пользы?",
"Когда мне делают комплимент, говорю ли я 'спасибо' или отвергаю его? Если отвергаю, то откуда у меня эта привычка?",
"Верю ли я, что я красив и достоин любви? Если нет, то откуда взялось это убеждение?",
"Если кто-то пытается дать мне денег или угостить обедом, принимаю ли я это или отказываюсь? Если мне трудно принять деньги, откуда это идет?",
"Что я считаю правдой о самом себе? Помогает мне это или вредит?",
"Беспорядок вокруг может отражать беспорядок в мыслях. Что я могу сделать прямо сейчас, чтобы навести порядок в своем окружении?",
"Что я могу сделать сегодня, чтобы стать ближе к своей цели?",
"Кто или что мешает мне делать то, чего я хочу? Как я могу изменить свое окружение или мышление, чтобы двигаться дальше?",
"Какой я хочу видеть свою жизнь через пять или десять лет?"
];

const form = $("#journal-form");
const titleInput = $("#entry-title");
const textInput = $("#entry-text");
const tagsInput = $("#entry-tags");
const energyInput = $("#energy");
const energyOutput = $("#energy-output");
const charCount = $("#character-count");
const formMsg = $("#form-message");
const entriesList = $("#entries-list");
const emptyState = $("#empty-state");
const searchInput = $("#search-input");
const promptText = $("#reflection-prompt");
const themeBtn = $("#theme-button");

let entries = getEntries();
let currentPrompt = "";
let msgTimer;

function startApp() {
  showDate();
  changePrompt();
  loadTheme();
  showEntries();
  updateStats();
}

function getEntries() {
  try {
    const data = localStorage.getItem(ENTRY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Could not load entries:", err);
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(ENTRY_KEY, JSON.stringify(entries));
}

function showDate() {
  $("#current-date").textContent = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function changePrompt() {
  let next = prompts[Math.floor(Math.random() * prompts.length)];

  while (next === currentPrompt && prompts.length > 1) {
    next = prompts[Math.floor(Math.random() * prompts.length)];
  }

  currentPrompt = next;
  promptText.textContent = currentPrompt;
}

$("#new-prompt-button").addEventListener("click", changePrompt);

textInput.addEventListener("input", () => {
  charCount.textContent = `${textInput.value.length} / 5000`;
});

energyInput.addEventListener("input", () => {
  energyOutput.textContent = `${energyInput.value} из 10`;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = textInput.value.trim();

  if (text.length < 10) {
    showMsg("Напиши хотя бы 10 символов.", true);
    return;
  }

  const mood = form.querySelector(
    'input[name="mood"]:checked'
  )?.value;

  const entry = {
    id: crypto.randomUUID(),
    title: titleInput.value.trim() || makeTitle(text),
    text,
    mood: mood || "Не указано",
    energy: Number(energyInput.value),
    tags: makeTags(tagsInput.value),
    prompt: currentPrompt,
    createdAt: new Date().toISOString()
  };

  entries.unshift(entry);

  saveEntries();
  showEntries(searchInput.value);
  updateStats();
  clearForm();

  showMsg("Запись сохранена.");
});

function makeTitle(text) {
  const firstLine = text.split(/[.!?]/)[0].trim();

  if (!firstLine) {
    return "Без названия";
  }

  return firstLine.length > 50
    ? `${firstLine.slice(0, 47)}...`
    : firstLine;
}

function makeTags(value) {
  const tags = value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

  return [...new Set(tags)].slice(0, 8);
}

function clearForm() {
  form.reset();

  energyInput.value = "5";
  energyOutput.textContent = "5 из 10";
  charCount.textContent = "0 / 5000";

  changePrompt();
}

function showMsg(text, isError = false) {
  clearTimeout(msgTimer);

  formMsg.textContent = text;
  formMsg.style.color = isError
    ? "var(--danger)"
    : "var(--accent)";

  msgTimer = setTimeout(() => {
    formMsg.textContent = "";
  }, 3000);
}

function showEntries(search = "") {
  entriesList.replaceChildren();

  const query = search.trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    const content = [
      entry.title,
      entry.text,
      entry.mood,
      ...(entry.tags || [])
    ]
      .join(" ")
      .toLowerCase();

    return content.includes(query);
  });

  showEmptyMessage(filtered.length, query);

  filtered.forEach((entry) => {
    entriesList.append(makeCard(entry));
  });
}

function showEmptyMessage(amount, query) {
  emptyState.hidden = amount > 0;

  const title = emptyState.querySelector("h3");
  const text = emptyState.querySelector("p");

  if (query) {
    title.textContent = "Ничего не найдено";
    text.textContent = "Попробуй изменить запрос.";
  } else {
    title.textContent = "Начни с первой записи";
    text.textContent =
      "Сохранённые размышления появятся здесь.";
  }
}

function makeCard(entry) {
  const card = document.createElement("article");
  card.className = "entry-card";

  const header = document.createElement("div");
  header.className = "entry-card-header";

  const date = document.createElement("time");
  date.dateTime = entry.createdAt;
  date.textContent = formatDate(entry.createdAt);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-button";
  deleteBtn.type = "button";
  deleteBtn.textContent = "Удалить";

  deleteBtn.addEventListener("click", () => {
    deleteEntry(entry.id);
  });

  header.append(date, deleteBtn);

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const preview = document.createElement("p");
  preview.className = "entry-preview";
  preview.textContent = entry.text;

  const info = document.createElement("div");
  info.className = "entry-metadata";

  info.append(
    makePill(entry.mood),
    makePill(`Энергия: ${entry.energy}/10`)
  );

  card.append(header, title, preview, info);

  if (entry.tags?.length) {
    const tagsBox = document.createElement("div");
    tagsBox.className = "entry-tags";

    entry.tags.forEach((item) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = `#${item}`;

      tagsBox.append(tag);
    });

    card.append(tagsBox);
  }

  return card;
}

function makePill(text) {
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = text;

  return pill;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function deleteEntry(id) {
  const entry = entries.find((item) => item.id === id);

  if (!entry) {
    return;
  }

  const accepted = confirm(
    `Удалить запись «${entry.title}»?`
  );

  if (!accepted) {
    return;
  }

  entries = entries.filter((item) => item.id !== id);

  saveEntries();
  showEntries(searchInput.value);
  updateStats();
}

searchInput.addEventListener("input", () => {
  showEntries(searchInput.value);
});

function updateStats() {
  $("#entries-count").textContent = entries.length;

  const avg = entries.length
    ? entries.reduce((sum, entry) => {
        return sum + Number(entry.energy);
      }, 0) / entries.length
    : null;

  $("#average-energy").textContent = avg
    ? avg.toFixed(1)
    : "—";

  $("#current-streak").textContent = getStreak();
}

function getStreak() {
  const dates = [
    ...new Set(
      entries.map((entry) => {
        return getDateKey(new Date(entry.createdAt));
      })
    )
  ].sort().reverse();

  if (!dates.length) {
    return 0;
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const latest = dates[0];

  if (
    latest !== getDateKey(today) &&
    latest !== getDateKey(yesterday)
  ) {
    return 0;
  }

  let streak = 1;
  let previous = readDateKey(latest);

  for (let i = 1; i < dates.length; i += 1) {
    const current = readDateKey(dates[i]);
    const days = Math.round((previous - current) / 86400000);

    if (days !== 1) {
      break;
    }

    streak += 1;
    previous = current;
  }

  return streak;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);

  return new Date(year, month - 1, day);
}

$("#export-button").addEventListener("click", exportJournal);

function exportJournal() {
  if (!entries.length) {
    alert("Сначала создай хотя бы одну запись.");
    return;
  }

  const data = {
    app: "Апогей",
    exportedAt: new Date().toISOString(),
    entries
  };

  const file = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = `apogey-${getDateKey(new Date())}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

themeBtn.addEventListener("click", () => {
  const current =
    document.documentElement.dataset.theme || "light";

  const next = current === "light" ? "dark" : "light";

  setTheme(next);
  localStorage.setItem(THEME_KEY, next);
});

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);

  if (saved === "light" || saved === "dark") {
    setTheme(saved);
    return;
  }

  const darkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  setTheme(darkMode ? "dark" : "light");
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;

  themeBtn.title =
    theme === "dark"
      ? "Включить светлую тему"
      : "Включить тёмную тему";
}

startApp();