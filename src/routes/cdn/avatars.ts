import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "../../database/repository/userRepo";

import { ErrorResponse } from "src/common/schemas/response";
import { fileType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/avatars/:userId/:avatar", {
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
      security: [],
    },
    handler: async (request, reply) => {
      const { userId, avatar } = request.params;

      const [avatarId, mimeType] = avatar.split(".");

      const user = await userRepo.findUserById(userId);
      if (!user || !user.avatarId) {
        throw new AppError("INVALID_RESOURCE");
      }

      if (user.avatarId.toString() !== avatarId) {
        throw new AppError("INVALID_RESOURCE");
      }

      const stream = userRepo.getAvatarStream(avatarId);
      if (!stream || !mimeType) {
        throw new AppError("INVALID_RESOURCE");
      }

      reply.header("Content-Type", `image/${mimeType}`);
      reply.header("Cache-Control", "public, max-age=86400"); // Cache for 1 day

      return reply.send(stream);
    },
  });
};

export default plugin;
