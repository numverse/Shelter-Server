import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/repository/userRepo";
import { snowflakeType } from "src/schemas/types";
import { ErrorResponse, UserBasicResponse } from "src/schemas/response";
import { USER_NOT_FOUND } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/:id", {
    schema: {
      params: Type.Object({ id: snowflakeType }),
      response: {
        200: UserBasicResponse,
        404: ErrorResponse,
      },
      tags: ["Users"],
      summary: "Get user by ID",
      description: "Retrieve a user by their ID",
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const user = await userRepo.findUserById(id);

      if (!user) {
        return reply.status(404).send(USER_NOT_FOUND);
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
