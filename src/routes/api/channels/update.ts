import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as channelRepo from "src/database/repository/channelRepo";
import * as userRepo from "src/database/repository/userRepo";
import { UserFlags } from "src/database/models/userModel";

import { channelTopicType, channelNameType, snowflakeType } from "src/common/schemas/types";
import { ChannelResponse, ErrorResponse } from "src/common/schemas/response";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch("/:channelId", {
    schema: {
      params: Type.Object({ channelId: snowflakeType }),
      body: Type.Object({
        name: Type.Optional(channelNameType),
        topic: Type.Optional(channelTopicType),
      }),
      response: {
        200: ChannelResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ["Channels"],
      summary: "Update a channel",
      description: "Update an existing channel's name or description",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }
      const userAllowed = await userRepo.hasAnyUserFlags(request.userId, UserFlags.MODERATOR);
      if (!userAllowed) {
        throw new AppError("PERMISSION_DENIED");
      }

      const { channelId } = request.params;
      const body = request.body;

      const channel = await channelRepo.updateChannel(channelId, body);
      if (!channel) {
        throw new AppError("CHANNEL_NOT_FOUND");
      }

      fastify.broadcast({
        type: "CHANNEL_UPDATE",
        payload: channel,
      });
      return reply.send({
        ...channel,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
