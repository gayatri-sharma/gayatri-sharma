# Gayatri Sharma Kurmatey

Portfolio for Gayatri Sharma Kurmatey, a Data Engineer and AI/ML Engineer based in San Francisco. The static site is hosted on GitHub Pages and includes a recruiter-facing assistant grounded in documented portfolio data.

- [Portfolio](https://gayatri-sharma.github.io/gayatri-sharma/)
- [Curriculum Vitae](https://gayatri-sharma.github.io/gayatri-sharma/assets/Resume_GayatriSharmaKurmatey.pdf)
- [LinkedIn](https://www.linkedin.com/in/gayatrikurmatey/)

## Recruiter assistant architecture

```text
GitHub Pages portfolio
  -> portfolio-chat.js
  -> secure Node API
  -> LangChain ChatOpenAI chain
  -> OpenAI API
       + data/portfolio-context.json
```

The browser never receives the OpenAI key. The API uses one constrained LangChain prompt and the structured portfolio context; it does not use web search, embeddings, a vector database, or tools. Questions without documented support are answered with a clear not-documented response.

## Local setup

Requirements: Node.js 20+ and Python 3.12+.

1. Install JavaScript dependencies: `pnpm install`
2. Create a local environment file from `.env.example` and set `OPENAI_API_KEY`.
3. Start the LangChain API: `pnpm start`
4. In another terminal, serve the static portfolio: `python -m http.server 8000`
5. Open `http://localhost:8000`. On localhost, the widget calls `http://localhost:3000/api/chat`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Server-side OpenAI credential. Never add it to Git. |
| `OPENAI_MODEL` | No | Model used by LangChain. Defaults to `gpt-5-mini`. |
| `ALLOWED_ORIGINS` | No | Comma-separated extra browser origins allowed by CORS. |
| `PORT` | No | API port. Defaults to `3000`. |

## Deployment

The frontend remains on GitHub Pages through `.github/workflows/pages.yml`.

Deploy the repository as a Node web service on a host that supports Node 20+ (for example Render, Railway, Fly.io, or a container host):

- Build command: `pnpm install --frozen-lockfile`
- Start command: `pnpm start`
- Health check: `/health`
- Add `OPENAI_API_KEY` as a secret in the backend host
- Set `ALLOWED_ORIGINS=https://gayatri-sharma.github.io`

For Render, `render.yaml` supplies these settings and prompts for `OPENAI_API_KEY` during Blueprint creation.

After the backend is live, set its public endpoint in `chat-config.js`:

```js
window.GAYATRI_AI_CONFIG = {
  apiUrl: "https://your-secure-backend.example/api/chat",
};
```

Commit that public API URL and let GitHub Pages redeploy. The URL is safe to publish; the API key is not.

## Updating the assistant

Edit `data/portfolio-context.json` when experience, projects, or skills change. Keep planned VoltX capabilities in `planned_not_implemented` until they are actually available. The API sends this file to the model as the only factual source.

## Tests

```bash
pnpm check
pnpm test
python -m pytest --verbose
```

The Node tests use a mocked answer function and do not call OpenAI or require an API key.

## Production hardening

The API includes an in-memory per-IP limit of 20 requests per 10 minutes. For multiple server instances or higher traffic, replace it with a shared store such as Redis and add bot protection at the hosting edge.
