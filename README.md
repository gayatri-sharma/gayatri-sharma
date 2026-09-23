# Gayatri Sharma Kurmatey

Portfolio for Gayatri Sharma Kurmatey, a Data Engineer and AI/ML Engineer based in San Francisco. The static site is hosted on GitHub Pages and includes a recruiter-facing assistant grounded in documented portfolio data.

- [Portfolio](https://gayatri-sharma.github.io/gayatri-sharma/)
- [Curriculum Vitae](https://gayatri-sharma.github.io/gayatri-sharma/assets/Resume_GayatriSharmaKurmatey.pdf)
- [LinkedIn](https://www.linkedin.com/in/gayatrikurmatey/)

## Recruiter assistant architecture

```text
GitHub Pages portfolio
  -> portfolio-chat.js
  -> Cloudflare Worker (secure API)
  -> constrained portfolio prompt
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

The frontend remains on GitHub Pages through `.github/workflows/pages.yml`. The secure API runs on a Cloudflare Worker through `.github/workflows/deploy-cloudflare-worker.yml`. Hugging Face remains the model provider.

Configure these GitHub repository secrets:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with Workers Scripts edit permission
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID
- `HF_TOKEN`: a Hugging Face token with permission to call Inference Providers

The Worker stores `HF_TOKEN` as a server-side secret and sends only the recruiter question and documented portfolio context to Hugging Face. No API key is sent to the browser. This avoids the paid Docker Space requirement.

After the Worker deploys, set its public URL in `chat-config.js`:

After the backend is live, set its public endpoint in `chat-config.js`:

```js
window.GAYATRI_AI_CONFIG = {
  apiUrl: "https://gayatri-portfolio-ai.<your-subdomain>.workers.dev/api/chat",
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
