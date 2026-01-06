import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as messageRepo from "../../../database/repository/messageRepo";
import * as channelRepo from "../../../database/repository/channelRepo";
import { messageContentType, snowflakeType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, CHANNEL_NOT_EXIST_OR_INACCESSIBLE } from "src/schemas/errors";
import { MessageResponse, ErrorResponse } from "src/schemas/response";
import { ChannelType } from "src/database/models/channelModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/", {
    schema: {
      body: Type.Object({
        channelId: snowflakeType,
        content: messageContentType,
        replyTo: Type.Optional(snowflakeType),
      }),
      response: {
        201: MessageResponse,
        404: ErrorResponse,
        401: ErrorResponse,
      },
      tags: ["Messages"],
      summary: "Create a new message",
      description: "Send a new message to a channel",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { channelId, content, replyTo } = request.body;

      const channelExists = await channelRepo.existsChannel(channelId, ChannelType.GuildText, ChannelType.GuildVoice);
      if (!channelExists) {
        return reply.status(404).send(CHANNEL_NOT_EXIST_OR_INACCESSIBLE);
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
