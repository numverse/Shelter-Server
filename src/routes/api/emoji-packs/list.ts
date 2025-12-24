import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as emojiPackRepo from "../../../database/repository/emojiPackRepo";
import { EmojiPackResponse } from "src/schemas/response";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/", {
    schema: {
      response: {
        200: Type.Object({
          emojiPacks: Type.Array(EmojiPackResponse),
        }),
      },
      tags: ["Emoji Packs"],
      summary: "List all emoji packs",
      description: "Retrieve all available emoji packs",
    },
    handler: async (request, reply) => {
      const packs = await emojiPackRepo.findAllEmojiPacks();
      const packsResponse = packs.map((pack) => ({
        ...pack,
        createdAt: pack.createdAt.toISOString(),
        updatedAt: pack.updatedAt?.toISOString(),
      }));
      return reply.send({
        emojiPacks: packsResponse,
      });
    },
  });
};

export default plugin;
