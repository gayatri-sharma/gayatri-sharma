import portfolioContext from "../../data/portfolio-context.json";

const DEFAULT_MODEL = "Qwen/Qwen3-14B";
const ALLOWED_ORIGIN = "https://gayatri-sharma.github.io";
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;
const requestLog = new Map();

const systemPrompt = `You are Gayatri Sharma Kurmatey's portfolio assistant for recruiters and hiring managers.

Answer questions using only the supplied portfolio context.
Your purpose is to clearly explain Gayatri's experience, projects, research, and technical skills.
Never invent experience, technologies, employers, accomplishments, metrics, publications, or responsibilities.
If something is not present in the supplied context, say exactly: "That information is not documented in Gayatri's portfolio."
Keep answers concise and recruiter-friendly.
When relevant, cite the specific project or experience that supports your answer.
Do not make exaggerated claims such as "perfect candidate" or "best fit."

Portfolio context:
${JSON.stringify(portfolioContext)}`;

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN || origin === "http://localhost:8000" || origin === "http://127.0.0.1:8000";
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(origin) });
}

function allowedRequest(request, origin) {
  return !origin || origin === ALLOWED_ORIGIN || origin === "http://localhost:8000" || origin === "http://127.0.0.1:8000";
}

function withinRateLimit(request) {
  const now = Date.now();
  const address = request.headers.get("CF-Connecting-IP") || "anonymous";
  const recent = (requestLog.get(address) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  requestLog.set(address, recent);
  return true;
}

function validHistory(history) {
  return Array.isArray(history) && history.length <= 6 && history.every(
    (item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string" && item.content.length <= 2000,
  );
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (!allowedRequest(request, origin)) return json({ error: "Origin is not allowed." }, 403, origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === "GET" && new URL(request.url).pathname === "/health") {
      return json({ status: "ok", modelProvider: "Hugging Face", runtime: "Cloudflare Workers" }, 200, origin);
    }
    if (request.method !== "POST" || new URL(request.url).pathname !== "/api/chat") {
      return json({ error: "Not found." }, 404, origin);
    }
    if (!withinRateLimit(request)) return json({ error: "Too many questions. Please try again in a few minutes." }, 429, origin);
    if (!env.HF_TOKEN) return json({ error: "The assistant is not configured yet." }, 503, origin);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be valid JSON." }, 400, origin);
    }

    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const jobDescription = typeof body?.jobDescription === "string" ? body.jobDescription.trim() : "";
    const history = body?.history || [];
    if (question.length < 2 || question.length > 1000) return json({ error: "Question must be between 2 and 1,000 characters." }, 400, origin);
    if (jobDescription.length > 12000) return json({ error: "Job description must be no more than 12,000 characters." }, 400, origin);
    if (!validHistory(history)) return json({ error: "Conversation history is invalid." }, 400, origin);

    const roleContext = jobDescription ? `\n\nJob description to compare against:\n${jobDescription}` : "";
    const messages = [
      { role: "system", content: systemPrompt + roleContext },
      ...history,
      { role: "user", content: question },
    ];

    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.HF_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: env.HF_MODEL || DEFAULT_MODEL, messages, temperature: 0.2, max_tokens: 500 }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Hugging Face request failed.");
      const answer = payload?.choices?.[0]?.message?.content?.trim();
      if (!answer) throw new Error("Hugging Face returned an empty answer.");
      return json({ answer }, 200, origin);
    } catch (error) {
      console.error("Portfolio assistant error:", error.message);
      return json({ error: "The portfolio assistant is temporarily unavailable." }, 503, origin);
    }
  },
};
