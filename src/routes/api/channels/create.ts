import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { generateSnowflake } from "../../../utils/snowflake";
import * as channelRepo from "../../../database/repository/channelRepo";
import { ChannelResponse, ErrorResponse } from "../../../schemas/response";
import { channelDescriptionType, channelNameType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, CHANNEL_CREATION_FAILED, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/", {
    schema: {
      body: Type.Object({
        name: channelNameType,
        description: Type.Optional(channelDescriptionType),
      }),
      response: {
        201: ChannelResponse,
        403: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Channels"],
      summary: "Create a new channel",
      description: "Create a new chat channel",
    },
    handler: async (request, reply) => {
      if (!request.user) {
        return reply.status(403).send(AUTHENTICATION_REQUIRED);
      }
      if (!fastify.bitFieldManager.hasEitherFlag(request.user.flags, UserFlags.MODERATOR | UserFlags.DEVELOPER)) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const { name, description } = request.body;

      const channel = await channelRepo.createChannel({
        id: generateSnowflake(),
        name,
        description,
      });
      if (!channel) {
        return reply.status(500).send(CHANNEL_CREATION_FAILED);
      }

      fastify.broadcast({
        type: "CHANNEL_CREATE",
        payload: channel,
      });

      return reply.status(201).send({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
