import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as messageRepo from "src/database/repository/messageRepo";
import * as channelRepo from "src/database/repository/channelRepo";
import { ChannelType } from "src/database/models/channelModel";

import { messageContentType, snowflakeType } from "src/common/schemas/types";
import { MessageResponse } from "src/common/schemas/response";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/", {
    schema: {
      params: Type.Object({
        channelId: snowflakeType,
      }),
      body: Type.Object({
        content: messageContentType,
        replyTo: Type.Optional(snowflakeType),
      }),
      response: {
        201: MessageResponse,
      },
      tags: ["Messages"],
      summary: "Create a new message",
      description: "Send a new message to a channel",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const { channelId } = request.params;
      const { content, replyTo } = request.body;

      const channelExists = await channelRepo.existsChannel(channelId, ChannelType.GuildText, ChannelType.GuildVoice);
      if (!channelExists) {
        throw new AppError("CHANNEL_NOT_EXIST_OR_INACCESSIBLE");
      }

      const message = await messageRepo.createMessage({
        id: fastify.snowflake.generate(),
        channelId,
        content: content,
        authorId: request.userId,
        replyTo,
        // attachments,
      });

      fastify.broadcast({ type: "MESSAGE_CREATE", payload: message });
      return reply.status(201).send({
        ...message,
        updatedAt: message.updatedAt?.toISOString(),
        createdAt: message.createdAt.toISOString(),
      });
    },
  });
};

export default plugin;
