const profileBot = document.querySelector(".profile-bot");
const launcher = document.querySelector(".bot-launcher");
const panel = document.querySelector(".bot-panel");
const closeButton = document.querySelector(".bot-close");
const messages = document.querySelector(".bot-messages");
const form = document.querySelector(".bot-form");
const input = document.querySelector(".bot-form input");
const submitButton = document.querySelector(".bot-form button");
const promptButtons = [...document.querySelectorAll(".bot-prompts button[data-question]")];
const status = document.querySelector(".bot-status");
const history = [];

function apiUrl() {
  const configured = window.GAYATRI_AI_CONFIG?.apiUrl?.trim();
  if (configured) return configured;
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://localhost:3000/api/chat";
  }
  return "";
}

function cleanAssistantLine(line) {
  return line
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-•]\s*/, "")
    .trim();
}

function appendAssistantContent(message, text) {
  const normalized = text
    .replace(/\r/g, "")
    .replace(/\s+•\s+/g, "\n• ")
    .replace(/\s+-\s+(?=[A-Z])/g, "\n- ");

  normalized.split(/\n+/).map((line) => {
    const isBullet = /^[-•]\s+/.test(line.trim());
    return { isBullet, text: cleanAssistantLine(line) };
  }).filter(({ text }) => text).forEach(({ isBullet, text: line }) => {
    const row = document.createElement("span");
    row.className = isBullet ? "bot-message-line bot-message-bullet" : "bot-message-line";
    const url = line.match(/^https?:\/\/\S+$/);
    if (url) {
      const link = document.createElement("a");
      link.href = url[0];
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open project demo";
      row.append(link);
    } else {
      row.textContent = isBullet ? `• ${line}` : line;
    }
    message.append(row);
  });
}

function addMessage(text, type = "bot") {
  if (!messages) return;
  const message = document.createElement("p");
  message.className = `bot-message bot-message-${type}`;
  if (type === "bot") {
    appendAssistantContent(message, text);
  } else {
    message.textContent = text;
  }
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function setLoading(loading) {
  profileBot?.classList.toggle("is-loading", loading);
  input.disabled = loading;
  submitButton.disabled = loading;
  promptButtons.forEach((button) => {
    button.disabled = loading;
  });
  status.textContent = loading ? "Reviewing Gayatri's portfolio..." : "";
}

function openPanel() {
  if (!profileBot || !launcher || !panel) return;
  profileBot.classList.add("is-open");
  panel.hidden = false;
  launcher.setAttribute("aria-expanded", "true");
  window.setTimeout(() => input?.focus(), 80);
}

function closePanel() {
  if (!profileBot || !launcher || !panel) return;
  profileBot.classList.remove("is-open");
  panel.hidden = true;
  launcher.setAttribute("aria-expanded", "false");
  launcher.focus();
}

async function ask(question) {
  const cleaned = question.trim();
  if (!cleaned || input.disabled) return;

  openPanel();
  addMessage(cleaned, "user");
  const requestHistory = history.slice(-6);
  history.push({ role: "user", content: cleaned });
  setLoading(true);

  try {
    const endpoint = apiUrl();
    if (!endpoint) {
      throw new Error("The secure AI service has not been connected yet.");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: cleaned,
        history: requestHistory,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "The assistant could not answer right now.");

    addMessage(payload.answer);
    history.push({ role: "assistant", content: payload.answer });
  } catch (error) {
    addMessage(`${error.message} Please try again later.`, "error");
  } finally {
    setLoading(false);
    input.focus();
  }
}

launcher?.addEventListener("click", () => (panel?.hidden ? openPanel() : closePanel()));
closeButton?.addEventListener("click", closePanel);

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  ask(input.value);
  input.value = "";
});

promptButtons.forEach((button) => {
  button.addEventListener("click", () => ask(button.dataset.question || button.textContent));
});
