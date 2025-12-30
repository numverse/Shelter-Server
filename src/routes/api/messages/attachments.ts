import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { AUTHENTICATION_REQUIRED, FILE_DELETE_FAILED, FILE_NOT_FOUND, MESSAGE_NOT_FOUND, PERMISSION_DENIED } from "src/schemas/errors";
import { snowflakeType } from "src/schemas/types";
import messageRepo from "src/database/repository/messageRepo";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete("/:messageId/attachments/:attachmentId", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
        attachmentId: snowflakeType,
      }),
      response: {
        204: SuccessResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Messages"],
      summary: "Delete a file",
      description: "Delete a file by ID",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { messageId, attachmentId } = request.params;

      const message = await messageRepo.findMessageById(messageId);
      if (!message) {
        return reply.status(404).send(MESSAGE_NOT_FOUND);
      }

      if (message.authorId !== request.userId) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      if (!message.attachments.find((att) => att.id === attachmentId)) {
        return reply.status(404).send(FILE_NOT_FOUND);
      }

      const newMessage = await messageRepo.removeAttachment(messageId, attachmentId);
      if (!newMessage) {
        return reply.status(500).send(FILE_DELETE_FAILED);
      }

      fastify.broadcast({
        type: "MESSAGE_UPDATE",
        payload: newMessage,
      });
      return reply.status(204).send({ success: true });
    },
  });
};

export default plugin;
