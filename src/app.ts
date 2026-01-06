import Fastify, { FastifyError } from "fastify";
import fastifyAutoload from "@fastify/autoload";
import path from "path";

declare module "fastify" {
  interface FastifyRequest {
    startTime?: number;
  }
}

export function log(message: string, source = "fastify") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createApp() {
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
    dir: path.join(import.meta.dirname, "routes/cdn"),
    options: {
      prefix: "/cdn",
    },
  });

  await fastify.register(import("./routes/gateway"), {
    prefix: "/gateway",
  });

  await fastify.register(import("./routes/api"), {
    prefix: "/api",
  });

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

  return fastify;
}
