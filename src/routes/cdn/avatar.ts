import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../database/repository/userRepo";
import { ErrorResponse } from "src/schemas/response";
import { INVALID_RESOURCE } from "src/schemas/errors";
import { fileType } from "src/schemas/types";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/avatar/:userId/:avatar", {
    schema: {
      params: Type.Object({
        userId: Type.String(),
        avatar: Type.String(),
      }),
      response: {
        200: fileType,
        404: ErrorResponse,
      },
      tags: ["CDN"],
      summary: "Get user avatar",
      description: "Get a user's avatar image by user ID",
    },
    handler: async (request, reply) => {
      const { userId, avatar } = request.params;

      const [avatarId, mimeType] = avatar.split(".");

      const user = await userRepo.findUserById(userId);
      if (!user || !user.avatarId) {
        return reply.status(404).send(INVALID_RESOURCE);
      }

      if (user.avatarId.toString() !== avatarId) {
        return reply.status(404).send(INVALID_RESOURCE);
      }

      const stream = userRepo.getAvatarStream(avatarId);
      if (!stream || !mimeType) {
        return reply.status(404).send(INVALID_RESOURCE);
      }

      reply.header("Content-Type", `image/${mimeType}`);
      reply.header("Cache-Control", "public, max-age=86400"); // Cache for 1 day

      return reply.send(stream);
    },
  });
};

export default plugin;
