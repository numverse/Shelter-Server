import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/repository/userRepo";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/username-attempt", {
    schema: {
      body: Type.Object({
        username: Type.String(),
      }),
      response: {
        200: Type.Object({
          taken: Type.Boolean(),
        }),
      },
      tags: ["Users"],
      summary: "List all users",
      description: "Retrieve a list of all users",
    },
    handler: async (request, reply) => {
      const taken = await userRepo.existsUserByUsername(request.body.username);
      return reply.send({
        taken,
      });
    },
  });
};

export default plugin;
