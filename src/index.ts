import Fastify, { type FastifyError } from "fastify";
import { PORT } from "./config";
import fastifyAutoload from "@fastify/autoload";
import path from "path";
import "./database";
import { redis } from "bun";

const fastify = Fastify({
  logger: false,
  bodyLimit: 10485760, // 10MB
});

await fastify.register(fastifyAutoload, {
  dir: path.join(import.meta.dirname, "plugins/external"),
  options: {},
});

await fastify.register(fastifyAutoload, {
  dir: path.join(import.meta.dirname, "plugins/app"),
  options: {},
});

await fastify.register(fastifyAutoload, {
  dir: path.join(import.meta.dirname, "routes"),
  autoHooks: true,
  cascadeHooks: true,
  options: {},
});

export function log(message: string, source = "fastify") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logging hook
fastify.addHook("onRequest", async (request) => {
  request.startTime = Date.now();
});

fastify.addHook("onResponse", async (request, reply) => {
  const duration = Date.now() - (request.startTime || 0);
  if (request.url.startsWith("/api")) {
    const logLine = `${request.method} ${request.url} ${reply.statusCode} in ${duration}ms`;
    log(logLine);
  }
});

// Error handler
fastify.setErrorHandler((error: FastifyError, request, reply) => {
  const status = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  log(`Error: ${message}`, "fastify");
  reply.status(status).send({ message });
});

declare module "fastify" {
  interface FastifyRequest {
    startTime?: number;
  }
}

(async () => {
  await fastify.listen({
    port: PORT,
    host: "0.0.0.0",
  });

  redis.connect();
  log("Connecting to " + process.env.REDIS_URL, "redis");

  redis.onconnect = () => {
    log("Connected to Redis ", "redis");
  };

  redis.onclose = () => {
    log("Disconnected from Redis", "redis");
    setTimeout(() => {
      redis.connect();
    }, 5000);
  };

  // Print all registered routes
  // console.log("Registered routes:");
  // console.log(fastify.printRoutes());

  log(`serving on port ${PORT}`);
})();
