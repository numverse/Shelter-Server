import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";

import { snowflakeType, usernameType } from "src/common/schemas/types";
import { UserBasicResponse } from "src/common/schemas/response";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/batch", {
    schema: {
      body: Type.Union([
        Type.Object({
          userIds: Type.Array(snowflakeType),
        }),
        Type.Object({
          usernames: Type.Array(usernameType),
        }),
      ]),
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
      if ("userIds" in request.body) {
        const users = await userRepo.findUsersByIds(request.body.userIds);
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
      } else if ("usernames" in request.body) {
        const users = await userRepo.findUsersByUsernames(request.body.usernames);
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
      }
    },
  });
};

export default plugin;
