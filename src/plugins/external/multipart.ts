import fp from "fastify-plugin";
import fastifyMultipart from "@fastify/multipart";

export default fp(async function (fastify) {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB for general files (GridFS)
      files: 10,
    },
  });
});
