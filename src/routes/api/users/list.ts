import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/repository/userRepo";
import { UserBasicResponse } from "src/schemas/response";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/", {
    schema: {
      response: {
        200: Type.Object({
          users: Type.Array(UserBasicResponse),
        }),
      },
      tags: ["Users"],
      summary: "List all users",
      description: "Retrieve a list of all users",
    },
    handler: async (request, reply) => {
      const users = await userRepo.findAllUsers();
      const usersResponse = users.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        flags: user.flags,
        avatarId: user.avatarId?.toString(),
        createdAt: user.createdAt.toISOString(),
      }));
      return reply.send({
        users: usersResponse,
      });
    },
  });
};

export default plugin;
