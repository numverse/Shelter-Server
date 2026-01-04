FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --production

COPY src ./src
COPY tsconfig.json ./

EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]
