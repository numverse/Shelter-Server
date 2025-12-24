import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as messageRepo from "../../../database/repository/messageRepo";
import { messageContentType, snowflakeType } from "src/schemas/types";
import { ErrorResponse, MessageResponse } from "src/schemas/response";
import { AUTHENTICATION_REQUIRED, MESSAGE_NOT_FOUND, MESSAGE_UPDATE_FAILED, PERMISSION_DENIED } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch("/:messageId", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
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
      if (!request.user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { messageId } = request.params;
      const { content } = request.body;

      // Check if user owns the message
      const message = await messageRepo.findMessageById(messageId);
      if (!message) {
        return reply.status(404).send(MESSAGE_NOT_FOUND);
      }
      if (message.authorId !== request.user.id) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const updatedMessage = await messageRepo.updateMessageContent(messageId, content);
      if (!updatedMessage) {
        return reply.status(500).send(MESSAGE_UPDATE_FAILED);
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
