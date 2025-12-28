import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as messageRepo from "../../../database/repository/messageRepo";
import * as userRepo from "../../../database/repository/userRepo";
import { AUTHENTICATION_REQUIRED, MESSAGE_DELETE_FAILED, MESSAGE_NOT_FOUND, PERMISSION_DENIED } from "src/schemas/errors";
import { ErrorResponse } from "src/schemas/response";
import { snowflakeType } from "src/schemas/types";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete("/:messageId", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
      }),
      response: {
        204: Type.Null(),
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Messages"],
      summary: "Delete a message",
      description: "Delete a message by ID",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { messageId } = request.params;

      // Check if user owns the message
      const message = await messageRepo.findMessageById(messageId);
      if (!message) {
        return reply.status(404).send(MESSAGE_NOT_FOUND);
      }
      if (message.authorId !== user.id
        && !fastify.bitFieldManager.hasEitherFlag(user.flags, UserFlags.MODERATOR | UserFlags.DEVELOPER)) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const deleted = await messageRepo.deleteMessage(messageId);
      if (!deleted) {
        return reply.status(500).send(MESSAGE_DELETE_FAILED);
      }

      // Broadcast to all WebSocket clients
      fastify.broadcast({ type: "MESSAGE_DELETE", payload: {
        channelId: message.channelId,
        messageId: message.id,
      } });
      return reply.status(204).send();
    },
  });
};

export default plugin;
