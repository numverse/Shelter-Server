import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { findAllUsers } from "src/database/repository/userRepo";

import { UserBasicResponse } from "src/common/schemas/response";

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
      const users = await findAllUsers();
      const usersResponse = users.map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        flags: user.flags,
        avatarId: user.avatarId?.toString(),
        createdAt: user.createdAt.toISOString(),
        presence: {
          status: fastify.clientManager.getClient(user.id) ? "online" : "offline" as "online" | "offline" | "away" | "dnd",
        },
      }));
      return reply.send({
        users: usersResponse,
      });
    },
  });
};

export default plugin;
