import { createApp, log } from "./app";
import { PORT } from "./config";
import { redis } from "bun";
import "./database";

(async () => {
  const fastify = await createApp();

  await fastify.listen({
    port: PORT,
    host: "0.0.0.0",
  });

  if (!redis.connected) {
    log("Connecting to " + process.env.REDIS_URL, "redis");
    redis.connect();

    redis.onconnect = () => {
      log("Connected to Redis ", "redis");
    };

    redis.onclose = () => {
      log("Disconnected from Redis", "redis");
      setTimeout(() => {
        redis.connect();
      }, 5000);
    };
  }

  // Print all registered routes
  // console.log("Registered routes:");
  // console.log(fastify.printRoutes());

  log(`serving on port ${PORT}`);
})();
