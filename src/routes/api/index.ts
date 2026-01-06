import fastifyAutoload from "@fastify/autoload";
import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import path from "path";

const apiRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "auth"),
    options: { prefix: "/auth" },
  });

  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "channels"),
    options: { prefix: "/channels" },
  });
};

export default apiRoutes;
