import fastifyRateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";
import { RATE_LIMIT_MAX } from "../../config.js";

export const autoConfig = (_fastify: FastifyInstance) => {
  return {
    hooks: "onPreHandler",
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
