import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/repository/userRepo";
import * as channelRepo from "../../../database/repository/channelRepo";
import { ChannelResponse, ErrorResponse } from "../../../schemas/response";
import { AUTHENTICATION_REQUIRED, CHANNEL_CREATION_FAILED, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";
import { CreateChannelQuery } from "src/schemas/query";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/", {
    schema: {
      body: CreateChannelQuery,
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
      if (!request.userId) {
        return reply.status(403).send(AUTHENTICATION_REQUIRED);
      }
      const userAllowed = await userRepo.hasAnyUserFlags(request.userId,
        UserFlags.MODERATOR, UserFlags.DEVELOPER);
      if (!userAllowed) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const channel = await channelRepo.createChannel({
        id: fastify.snowflake.generate(),
        ...request.body,
      });
      if (!channel) {
        return reply.status(500).send(CHANNEL_CREATION_FAILED);
      }

      fastify.broadcast({
        type: "CHANNEL_CREATE",
        payload: channel,
      });
      return reply.status(201).send({
        ...channel,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
