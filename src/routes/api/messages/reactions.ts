import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as messageRepo from "src/database/repository/messageRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { snowflakeType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Add reaction
  fastify.put("/:messageId/reactions/:emojiId", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
        emojiId: snowflakeType,
      }),
      response: {
        200: SuccessResponse,
      },
      tags: ["Messages"],
      summary: "Add reaction",
      description: "Add an emoji reaction to a message",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const { messageId, emojiId } = request.params;

      const message = await messageRepo.addReaction(messageId, emojiId, request.userId);
      if (!message) {
        throw new AppError("MESSAGE_NOT_FOUND");
      }

      // Broadcast to all WebSocket clients
      fastify.broadcast({
        type: "REACTION_ADD", payload: {
          messageId,
          emojiId,
          userId: request.userId,
        },
      });

      return reply.send({ success: true });
    },
  });

  // Remove reaction
  fastify.delete("/:messageId/reactions/:emojiId", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
        emojiId: snowflakeType,
      }),
      response: {
        204: SuccessResponse,
      },
      tags: ["Messages"],
      summary: "Remove reaction",
      description: "Remove an emoji reaction from a message",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const { messageId, emojiId } = request.params;

      const message = await messageRepo.removeReaction(
        messageId,
        emojiId,
        request.userId,
      );
      if (!message) {
        throw new AppError("MESSAGE_NOT_FOUND");
      }

      // Broadcast to all WebSocket clients
      fastify.broadcast({
        type: "REACTION_REMOVE", payload: {
          messageId,
          emojiId,
          userId: request.userId,
        },
      });

      return reply.status(204).send({ success: true });
    },
  });
};

export default plugin;
