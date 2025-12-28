import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as emojiPackRepo from "../../../database/repository/emojiPackRepo";
import * as userRepo from "../../../database/repository/userRepo";
import { ErrorResponse } from "src/schemas/response";
import { snowflakeType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, EMOJI_PACK_DELETE_FAILED, EMOJI_PACK_NOT_FOUND, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete("/:id", {
    schema: {
      params: Type.Object({
        id: snowflakeType,
      }),
      response: {
        204: Type.Null(),
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
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { id } = request.params;
      const pack = await emojiPackRepo.findEmojiPackById(id);
      if (!pack) {
        return reply.status(404).send(EMOJI_PACK_NOT_FOUND);
      }

      // Check permission: creator only
      if (pack.creatorId !== user.id
        || fastify.bitFieldManager.hasEitherFlag(user.flags, UserFlags.MODERATOR | UserFlags.DEVELOPER)
      ) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const deleted = await emojiPackRepo.deleteEmojiPack(id);
      if (!deleted) {
        return reply.status(500).send(EMOJI_PACK_DELETE_FAILED);
      }

      return reply.status(204).send();
    },
  });
};

export default plugin;
