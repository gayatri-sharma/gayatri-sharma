import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { createApp } from "../server/app.js";
import { createPortfolioChain } from "../server/portfolio-chain.js";

let baseUrl;
let server;

before(async () => {
  const app = createApp({
    answerQuestion: async ({ question, jobDescription }) =>
      `Grounded response to: ${question}${jobDescription ? " with role context" : ""}`,
  });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test("health endpoint identifies LangChain", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    framework: "LangChain",
    modelProvider: "Hugging Face",
  });
});

test("chat endpoint returns an answer", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:8000" },
    body: JSON.stringify({ question: "Tell me about VoltX" }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:8000");
  assert.match((await response.json()).answer, /VoltX/);
});

test("chat endpoint rejects invalid input", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "" }),
  });
  assert.equal(response.status, 400);
});

test("chat endpoint rejects an unapproved browser origin", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.com" },
    body: JSON.stringify({ question: "Tell me about VoltX" }),
  });
  assert.equal(response.status, 403);
});

test("job description is passed to the chain", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "How does Gayatri relate to this role?", jobDescription: "Python and SQL" }),
  });
  assert.equal(response.status, 200);
  assert.match((await response.json()).answer, /role context/);
});

test("LangChain passes portfolio grounding and conversation to Hugging Face", async () => {
  let inferenceRequest;
  const chain = createPortfolioChain({
    chatCompletion: async (request) => {
      inferenceRequest = request;
      return "Gayatri has documented data engineering experience.";
    },
    model: "Qwen/Qwen3-14B:nscale",
  });
  const answer = await chain.invoke({
    context: '{"experience":[{"organization":"Belong Automotive Technologies"}]}',
    question: "What data engineering experience does Gayatri have?",
    jobDescription: "SQL and pipelines",
    history: [],
  });

  assert.match(answer, /documented data engineering experience/);
  assert.equal(inferenceRequest.model, "Qwen/Qwen3-14B:nscale");
  assert.equal(inferenceRequest.messages[0].role, "system");
  assert.equal(inferenceRequest.messages[1].role, "user");
  assert.match(inferenceRequest.messages[1].content, /Belong Automotive Technologies/);
  assert.match(inferenceRequest.messages[1].content, /SQL and pipelines/);
});
