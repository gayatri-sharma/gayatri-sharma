import express from "express";

import { answerPortfolioQuestion } from "./portfolio-chain.js";

const DEFAULT_ORIGINS = [
  "https://gayatri-sharma.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

function allowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ORIGINS, ...configured]);
}

function validHistory(history) {
  return (
    history === undefined ||
    (Array.isArray(history) &&
      history.length <= 6 &&
      history.every(
        (item) =>
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string" &&
          item.content.length <= 2000,
      ))
  );
}

export function createApp({ answerQuestion = answerPortfolioQuestion } = {}) {
  const app = express();
  const requests = new Map();
  const origins = allowedOrigins();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && !origins.has(origin)) {
      return res.status(403).json({ error: "Origin is not allowed." });
    }
    if (origin && origins.has(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      return origin && origins.has(origin) ? res.sendStatus(204) : res.sendStatus(403);
    }
    return next();
  });
  app.use("/api/chat", (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    const recent = (requests.get(key) || []).filter((time) => now - time < WINDOW_MS);
    if (recent.length >= MAX_REQUESTS) {
      return res.status(429).json({ error: "Too many questions. Please try again in a few minutes." });
    }
    recent.push(now);
    requests.set(key, recent);
    return next();
  });

  app.get("/health", (_req, res) => res.json({ status: "ok", framework: "LangChain" }));

  app.post("/api/chat", async (req, res) => {
    const { question, jobDescription = "", history = [] } = req.body || {};
    if (typeof question !== "string" || question.trim().length < 2 || question.length > 1000) {
      return res.status(400).json({ error: "Question must be between 2 and 1,000 characters." });
    }
    if (typeof jobDescription !== "string" || jobDescription.length > 12000) {
      return res.status(400).json({ error: "Job description must be no more than 12,000 characters." });
    }
    if (!validHistory(history)) {
      return res.status(400).json({ error: "Conversation history is invalid." });
    }

    try {
      const answer = await answerQuestion({
        question: question.trim(),
        jobDescription: jobDescription.trim(),
        history,
      });
      return res.json({ answer });
    } catch (error) {
      console.error("Portfolio assistant error:", error.message);
      return res.status(503).json({ error: "The portfolio assistant is temporarily unavailable." });
    }
  });

  app.use((error, _req, res, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({ error: "Request body must be valid JSON." });
    }
    return next(error);
  });

  return app;
}
