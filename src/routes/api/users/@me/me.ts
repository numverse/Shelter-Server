import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../../database/repository/userRepo";
import { ErrorResponse, UserResponse } from "../../../../schemas/response";
import { AUTHENTICATION_REQUIRED } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("", {
    schema: {
      response: {
        200: UserResponse,
        401: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ["Users/@me"],
      summary: "Get current user",
      description: "Retrieve information about the currently authenticated user",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      return reply.send({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        flags: user.flags,
        emojiPacks: user.emojiPacks,
        avatarId: user.avatarId?.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
