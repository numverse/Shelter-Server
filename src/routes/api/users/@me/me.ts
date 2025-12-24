import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
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
      if (!request.user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      return reply.send({
        id: request.user.id,
        username: request.user.username,
        displayName: request.user.displayName,
        email: request.user.email,
        flags: request.user.flags,
        emojiPacks: request.user.emojiPacks,
        avatarId: request.user.avatarId?.toString(),
        createdAt: request.user.createdAt.toISOString(),
        updatedAt: request.user.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
