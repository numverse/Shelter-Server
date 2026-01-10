import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as emojiPackRepo from "src/database/repository/emojiPackRepo";
import * as userRepo from "src/database/repository/userRepo";
import { UserFlags } from "src/database/models/userModel";

import { ErrorResponse, SuccessResponse } from "src/common/schemas/response";
import { snowflakeType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete("/:id", {
    schema: {
      params: Type.Object({
        id: snowflakeType,
      }),
      response: {
        204: SuccessResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Emoji Packs"],
      summary: "Delete an emoji pack",
      description: "Delete an emoji pack by ID",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const { id } = request.params;
      const pack = await emojiPackRepo.findEmojiPackById(id);
      if (!pack) {
        throw new AppError("EMOJI_PACK_NOT_FOUND");
      }

      // Check permission: creator only
      if (pack.creatorId !== user.id
        || fastify.bitFieldManager.hasEitherFlag(user.flags, UserFlags.MODERATOR)
      ) {
        throw new AppError("PERMISSION_DENIED");
      }

      const deleted = await emojiPackRepo.deleteEmojiPack(id);
      if (!deleted) {
        throw new AppError("EMOJI_PACK_DELETE_FAILED");
      }

      return reply.status(204).send({ success: true });
    },
  });
};

export default plugin;
