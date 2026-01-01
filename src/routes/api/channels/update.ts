import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as channelRepo from "../../../database/repository/channelRepo";
import * as userRepo from "../../../database/repository/userRepo";
import { ChannelResponse, ErrorResponse } from "../../../schemas/response";
import { channelTopicType, channelNameType, snowflakeType } from "src/schemas/types";
import { CHANNEL_NOT_FOUND, AUTHENTICATION_REQUIRED, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

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
        return reply.status(403).send(AUTHENTICATION_REQUIRED);
      }
      const userAllowed = await userRepo.hasAnyUserFlags(request.userId,
        UserFlags.MODERATOR, UserFlags.DEVELOPER);
      if (!userAllowed) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const { channelId } = request.params;
      const body = request.body;

      const channel = await channelRepo.updateChannel(channelId, body);
      if (!channel) {
        return reply.status(404).send(CHANNEL_NOT_FOUND);
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
