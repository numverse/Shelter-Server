import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as emojiPackRepo from "../../../../database/repository/emojiPackRepo";
import * as userRepo from "../../../../database/repository/userRepo";
import { ErrorResponse, SuccessResponse } from "../../../../schemas/response";
import { snowflakeType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, EMOJI_PACK_NOT_FOUND } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.put("/emoji-packs/:id", {
    schema: {
      params: Type.Object({
        id: snowflakeType,
      }),
      response: {
        200: SuccessResponse,
        404: ErrorResponse,
        401: ErrorResponse,
      },
      tags: ["Users/@me"],
      summary: "Add emoji pack",
      description: "Add an emoji pack to user's collection",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }
      const { id } = request.params;

      if (!user.emojiPacks.includes(id)) {
        const packExists = await emojiPackRepo.existsEmojiPackById(id);
        if (!packExists) {
          return reply.status(404).send(EMOJI_PACK_NOT_FOUND);
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
        204: Type.Null(),
        401: ErrorResponse,
      },
      tags: ["Users/@me"],
      summary: "Remove emoji pack",
      description: "Remove an emoji pack from user's collection",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }
      const { id } = request.params;

      // Update user's emoji packs in MongoDB

      if (user.emojiPacks.includes(id)) {
        await userRepo.removeUserEmojiPack(user.id, id);
      }

      return reply.status(204).send();
    },
  });
};

export default plugin;
