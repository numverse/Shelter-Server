import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as messageRepo from "../../../database/repository/messageRepo";

import { messageContentType, snowflakeType } from "src/common/schemas/types";
import { ErrorResponse, MessageResponse } from "src/common/schemas/response";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch("/", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
        channelId: snowflakeType,
      }),
      body: Type.Object({
        content: messageContentType,
      }),
      response: {
        200: MessageResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Messages"],
      summary: "Update a message",
      description: "Edit an existing message content",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const { messageId } = request.params;
      const { content } = request.body;

      // Check if user owns the message
      const message = await messageRepo.findMessageById(messageId);
      if (!message) {
        throw new AppError("MESSAGE_NOT_FOUND");
      }
      if (message.authorId !== request.userId) {
        throw new AppError("PERMISSION_DENIED");
      }

      const updatedMessage = await messageRepo.updateMessageContent(messageId, content);
      if (!updatedMessage) {
        throw new AppError("MESSAGE_UPDATE_FAILED");
      }

      // Broadcast to all WebSocket clients
      fastify.broadcast({ type: "MESSAGE_UPDATE", payload: updatedMessage });

      return reply.send({
        ...updatedMessage,
        createdAt: updatedMessage.createdAt.toISOString(),
        updatedAt: updatedMessage.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
