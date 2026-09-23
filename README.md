# Gayatri Sharma Kurmatey

Portfolio for Gayatri Sharma Kurmatey, a Data Engineer and AI/ML Engineer based in San Francisco. The static site is hosted on GitHub Pages and includes a recruiter-facing assistant grounded in documented portfolio data.

- [Portfolio](https://gayatri-sharma.github.io/gayatri-sharma/)
- [Curriculum Vitae](https://gayatri-sharma.github.io/gayatri-sharma/assets/Resume_GayatriSharmaKurmatey.pdf)
- [LinkedIn](https://www.linkedin.com/in/gayatrikurmatey/)

## Recruiter assistant architecture

```text
GitHub Pages portfolio
  -> portfolio-chat.js
  -> Hugging Face Docker Space (secure Node API)
  -> LangChain prompt chain
  -> Hugging Face Inference Providers
       + data/portfolio-context.json
```

The browser never receives the Hugging Face token. The API uses one constrained LangChain prompt and the structured portfolio context; it does not use web search, embeddings, a vector database, or tools. Questions without documented support are answered with a clear not-documented response.

## Local setup

Requirements: Node.js 20+ and Python 3.12+.

1. Install JavaScript dependencies: `pnpm install`
2. Create a local environment file from `.env.example` and set `HF_TOKEN`. Create a Hugging Face token with permission to call Inference Providers.
3. Start the LangChain API: `pnpm start`
4. In another terminal, serve the static portfolio: `python -m http.server 8000`
5. Open `http://localhost:8000`. On localhost, the widget calls `http://localhost:3000/api/chat`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `HF_TOKEN` | Yes | Server-side Hugging Face access token with Inference Providers permission. Never add it to Git. |
| `HF_MODEL` | No | Hugging Face model/provider. Defaults to `Qwen/Qwen3-14B:nscale`. |
| `ALLOWED_ORIGINS` | No | Comma-separated extra browser origins allowed by CORS. |
| `PORT` | No | API port. Defaults to `3000`. |

## Deployment

The frontend remains on GitHub Pages through `.github/workflows/pages.yml`. The backend is deployed as a Hugging Face Docker Space using `hf-space/Dockerfile` and synchronized by `.github/workflows/deploy-huggingface-space.yml`.

Create a new Hugging Face Space with the Docker SDK, then configure:

- Repository variable: `HF_SPACE_ID`, in the form `username/space-name`
- Repository secret: `HF_TOKEN`, with permission to write to the Space and call Inference Providers
- Space secret: `HF_TOKEN`, with permission to call Inference Providers
- Space variable: `HF_MODEL=Qwen/Qwen3-14B:nscale`
- Space variable: `ALLOWED_ORIGINS=https://gayatri-sharma.github.io`

The deployment workflow copies only the API runtime, portfolio context, package files, and Docker metadata into the Space. The token is never committed or sent to the browser. Hugging Face exposes the running API at `https://username-space-name.hf.space`.

After the backend is live, set its public endpoint in `chat-config.js`:

```js
window.GAYATRI_AI_CONFIG = {
  apiUrl: "https://username-space-name.hf.space/api/chat",
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

The Node tests use a mocked answer function and do not call Hugging Face or require a token.

## Production hardening

The API includes an in-memory per-IP limit of 20 requests per 10 minutes. For multiple server instances or higher traffic, replace it with a shared store such as Redis and add bot protection at the hosting edge.
