import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as messageRepo from "../../../database/repository/messageRepo";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { AUTHENTICATION_REQUIRED, MESSAGE_NOT_FOUND } from "src/schemas/errors";
import { snowflakeType } from "src/schemas/types";

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
        401: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ["Messages"],
      summary: "Add reaction",
      description: "Add an emoji reaction to a message",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { messageId, emojiId } = request.params;

      const message = await messageRepo.addReaction(messageId, emojiId, request.userId);
      if (!message) {
        return reply.status(404).send(MESSAGE_NOT_FOUND);
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
        401: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ["Messages"],
      summary: "Remove reaction",
      description: "Remove an emoji reaction from a message",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { messageId, emojiId } = request.params;

      const message = await messageRepo.removeReaction(
        messageId,
        emojiId,
        request.userId,
      );
      if (!message) {
        return reply.status(404).send(MESSAGE_NOT_FOUND);
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
