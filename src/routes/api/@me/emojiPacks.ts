import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as emojiPackRepo from "src/database/repository/emojiPackRepo";
import * as userRepo from "src/database/repository/userRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { snowflakeType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.put("/emoji-packs/:id", {
    schema: {
      params: Type.Object({
        id: snowflakeType,
      }),
      response: {
        200: SuccessResponse,
      },
      tags: ["Users/@me"],
      summary: "Add emoji pack",
      description: "Add an emoji pack to user's collection",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }
      const { id } = request.params;

      if (!user.emojiPacks.includes(id)) {
        const packExists = await emojiPackRepo.existsEmojiPackById(id);
        if (!packExists) {
          throw new AppError("EMOJI_PACK_NOT_FOUND");
        }

        await userRepo.addUserEmojiPack(user.id, id);
      }

      return reply.send({ success: true });
    },
  });

  fastify.delete("/emoji-packs/:id", {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
      response: {
        204: SuccessResponse,
      },
      tags: ["Users/@me"],
      summary: "Remove emoji pack",
      description: "Remove an emoji pack from user's collection",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }
      const { id } = request.params;

      // Update user's emoji packs in MongoDB

      if (user.emojiPacks.includes(id)) {
        await userRepo.removeUserEmojiPack(user.id, id);
      }

      return reply.status(204).send({ success: true });
    },
  });
};

export default plugin;
