import fastifyRateLimit, { type errorResponseBuilderContext } from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { RATE_LIMIT_MAX } from "../../config/index.js";
import { redis } from "bun";

export const autoConfig = (_fastify: FastifyInstance) => {
  return {
    errorResponseBuilder: (req: FastifyRequest, context: errorResponseBuilderContext) => {
      return {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Rate limit exceeded, retry in ${(Math.ceil(context.ttl / 1000))} seconds`,
        error: "Too Many Requests",
        statusCode: 429,
      };
    },
    max: RATE_LIMIT_MAX,
    // redis: redis,
    timeWindow: 60 * 1000, // 1 minute
  };
};

/**
 * This plugins is low overhead rate limiter for your routes.
 *
 * @see {@link https://github.com/fastify/fastify-rate-limit}
 */
export default fastifyRateLimit;
