import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { findUserById } from "src/database/repository/userRepo";

import { snowflakeType } from "src/common/schemas/types";
import { UserBasicResponse } from "src/common/schemas/response";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/:userId", {
    schema: {
      params: Type.Object({ userId: snowflakeType }),
      response: {
        200: UserBasicResponse,
      },
      tags: ["Users"],
      summary: "Get user by ID",
      description: "Retrieve a user by their ID",
    },
    handler: async (request, reply) => {
      const { userId } = request.params;
      const user = await findUserById(userId);

      if (!user) {
        throw new AppError("USER_NOT_FOUND");
      }

      return reply.send({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        flags: user.flags,
        avatarId: user.avatarId?.toString(),
        createdAt: user.createdAt.toISOString(),
      });
    },
  });
};

export default plugin;
