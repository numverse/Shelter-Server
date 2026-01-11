import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as messageRepo from "src/database/repository/messageRepo";

import { MessageResponse } from "src/common/schemas/response";
import { snowflakeType } from "src/common/schemas/types";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/", {
    schema: {
      params: Type.Object({
        channelId: snowflakeType,
      }),
      querystring: Type.Object({
        limit: Type.Optional(Type.String({ pattern: "^[0-9]+$" })),
        before: Type.Optional(snowflakeType),
        after: Type.Optional(snowflakeType),
        around: Type.Optional(snowflakeType),
      }),
      response: {
        200: Type.Object({
          messages: Type.Array(MessageResponse),
        }),
      },
      tags: ["Messages"],
      summary: "List messages",
      description: "Retrieve messages from a channel with optional pagination",
    },
    handler: async (request, reply) => {
      const { channelId } = request.params;
      const { limit, before, after, around } = request.query;

      const result = await messageRepo.findMessagesByChannel(channelId, {
        limit: Math.min(parseInt(limit || "50", 10) || 50, 50),
        before: before,
        after: after,
        around: around,
      });

      return reply.send({
        messages: result.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt?.toISOString(),
        })),
      });
    },
  });
};

export default plugin;
