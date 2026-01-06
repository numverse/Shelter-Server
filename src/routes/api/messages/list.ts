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
        messageId: Type.Optional(snowflakeType),
      }),
      response: {
        200: Type.Object({
          messages: Type.Array(MessageResponse),
          hasMore: Type.Boolean(),
        }),
      },
      tags: ["Messages"],
      summary: "List messages",
      description: "Retrieve messages from a channel with optional pagination",
    },
    handler: async (request, reply) => {
      const { channelId } = request.params;
      const { limit, messageId } = request.query;

      const messageLimit = Math.min(parseInt(limit || "50", 10) || 50, 100);
      const result = await messageRepo.findMessagesByChannel(channelId, messageLimit, messageId);
      return reply.send({
        messages: result.messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt?.toISOString(),
        })),
        hasMore: result.hasMore,
      });
    },
  });

  fastify.get("/around/:messageId", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
      }),
      querystring: Type.Object({
        beforeCount: Type.Optional(Type.String({ pattern: "^[0-9]+$" })),
        afterCount: Type.Optional(Type.String({ pattern: "^[0-9]+$" })),
      }),
      response: {
        200: Type.Object({
          anchor: Type.Optional(MessageResponse),
          before: Type.Object({
            messages: Type.Array(MessageResponse),
            hasMore: Type.Boolean(),
          }),
          after: Type.Object({
            messages: Type.Array(MessageResponse),
            hasMore: Type.Boolean(),
          }),
        }),
      },
      tags: ["Messages"],
      summary: "List messages",
      description: "Retrieve messages from a channel with optional pagination",
    },
    handler: async (request, reply) => {
      const { messageId } = request.params;
      const { beforeCount, afterCount } = request.query;

      const beforeLimit = Math.min(parseInt(beforeCount || "20", 10) || 20, 100);
      const afterLimit = Math.min(parseInt(afterCount || "20", 10) || 20, 100);
      const result = await messageRepo.findMessagesAround(messageId, beforeLimit, afterLimit);
      return reply.send({
        anchor: result.anchor
          ? {
            ...result.anchor,
            createdAt: result.anchor.createdAt.toISOString(),
            updatedAt: result.anchor.updatedAt?.toISOString(),
          }
          : undefined,
        before: {
          messages: result.before.messages.map((message) => ({
            ...message,
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt?.toISOString(),
          })),
          hasMore: result.before.hasMore,
        },
        after: {
          messages: result.after.messages.map((message) => ({
            ...message,
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt?.toISOString(),
          })),
          hasMore: result.after.hasMore,
        },
      });
    },
  });
};

export default plugin;
