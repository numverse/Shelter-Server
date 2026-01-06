import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { findEmojiById, getEmojiMimeType, getEmojiImageStream } from "src/database/repository/emojiPackRepo";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/emojis/:emojiId", {
    schema: {
      params: Type.Object({
        emojiId: Type.String(),
      }),
      tags: ["CDN"],
      summary: "Get emoji image",
      description: "Get an emoji image by emoji ID",
      security: [],
    },
    handler: async (request, reply) => {
      const { emojiId } = request.params;

      const emoji = await findEmojiById(emojiId);
      if (!emoji) {
        return reply.status(404).send({ error: "emoji_not_found" });
      }

      try {
        const mimeType = await getEmojiMimeType(emojiId);
        const stream = getEmojiImageStream(emojiId);

        reply.header("Content-Type", mimeType);
        reply.header("Cache-Control", "public, max-age=86400"); // Cache for 1 day

        return reply.send(stream);
      } catch (_) {
        return reply.status(404).send({ error: "avatar_not_found" });
      }
    },
  });
};

export default plugin;
