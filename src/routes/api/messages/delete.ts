import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as messageRepo from "src/database/repository/messageRepo";
import * as userRepo from "src/database/repository/userRepo";
import { UserFlags } from "src/database/models/userModel";

import { SuccessResponse } from "src/common/schemas/response";
import { snowflakeType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete("/:messageId", {
    schema: {
      params: Type.Object({
        messageId: snowflakeType,
        channelId: snowflakeType,
      }),
      response: {
        204: SuccessResponse,
      },
      tags: ["Messages"],
      summary: "Delete a message",
      description: "Delete a message by ID",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const { messageId } = request.params;

      // Check if user owns the message
      const message = await messageRepo.findMessageById(messageId);
      if (!message) {
        throw new AppError("MESSAGE_NOT_FOUND");
      }
      if (message.authorId !== user.id
        && !fastify.bitFieldManager.hasEitherFlag(user.flags, UserFlags.MODERATOR)) {
        throw new AppError("PERMISSION_DENIED");
      }

      const deleted = await messageRepo.deleteMessage(messageId);
      if (!deleted) {
        throw new AppError("MESSAGE_DELETE_FAILED");
      }

      // Broadcast to all WebSocket clients
      fastify.broadcast({ type: "MESSAGE_DELETE", payload: {
        channelId: message.channelId,
        messageId: message.id,
      } });
      return reply.status(204).send({ success: true });
    },
  });
};

export default plugin;
