import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";

export default fp(async function (fastify) {
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins (configure for production)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
});
