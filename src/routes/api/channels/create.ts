import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";
import * as channelRepo from "src/database/repository/channelRepo";
import { UserFlags } from "src/database/models/userModel";

import { ChannelResponse } from "src/common/schemas/response";
import { CreateChannelQuery } from "src/common/schemas/query";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/", {
    schema: {
      body: CreateChannelQuery,
      response: {
        201: ChannelResponse,
      },
      tags: ["Channels"],
      summary: "Create a new channel",
      description: "Create a new chat channel",

    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }
      const userAllowed = await userRepo.hasAnyUserFlags(request.userId,
        UserFlags.MODERATOR, UserFlags.DEVELOPER);
      if (!userAllowed) {
        throw new AppError("PERMISSION_DENIED");
      }

      const channel = await channelRepo.createChannel({
        id: fastify.snowflake.generate(),
        ...request.body,
      });
      if (!channel) {
        throw new AppError("CHANNEL_CREATION_FAILED");
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
