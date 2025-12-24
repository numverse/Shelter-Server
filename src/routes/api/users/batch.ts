import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/repository/userRepo";
import { snowflakeType } from "src/schemas/types";
import { UserBasicResponse } from "src/schemas/response";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/batch", {
    schema: {
      body: Type.Object({
        userIds: Type.Array(snowflakeType),
      }),
      response: {
        200: Type.Object({
          users: Type.Array(UserBasicResponse),
        }),
      },
      tags: ["Users"],
      summary: "Get multiple users",
      description: "Retrieve multiple users by their IDs",
    },
    handler: async (request, reply) => {
      const { userIds } = request.body;
      const users = await userRepo.findUsersByIds(userIds);
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
