FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY server ./server
COPY data ./data

ENV NODE_ENV=production
ENV PORT=7860

EXPOSE 7860

CMD ["pnpm", "start"]
