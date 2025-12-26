import fastifyRateLimit, { type errorResponseBuilderContext } from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { RATE_LIMIT_MAX } from "../../config.js";
import { RATE_LIMIT_EXCEEDED } from "../../schemas/errors";

export const autoConfig = (_fastify: FastifyInstance) => {
  return {
    errorResponseBuilder: (req: FastifyRequest, context: errorResponseBuilderContext) => {
      return RATE_LIMIT_EXCEEDED(Math.ceil(context.ttl / 1000));
    },
    max: RATE_LIMIT_MAX,
    timeWindow: 60 * 1000, // 1 minute
  };
};

/**
 * This plugins is low overhead rate limiter for your routes.
 *
 * @see {@link https://github.com/fastify/fastify-rate-limit}
 */
export default fastifyRateLimit;
