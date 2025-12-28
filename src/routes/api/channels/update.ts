import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as channelRepo from "../../../database/repository/channelRepo";
import * as userRepo from "../../../database/repository/userRepo";
import { ChannelResponse, ErrorResponse } from "../../../schemas/response";
import { channelDescriptionType, channelNameType, snowflakeType } from "src/schemas/types";
import { CHANNEL_NOT_FOUND, AUTHENTICATION_REQUIRED, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch("/:id", {
    schema: {
      params: Type.Object({ id: snowflakeType }),
      body: Type.Object({
        name: Type.Optional(channelNameType),
        description: Type.Optional(channelDescriptionType),
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
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        return reply.status(403).send(AUTHENTICATION_REQUIRED);
      }
      if (!fastify.bitFieldManager.hasEitherFlag(user.flags, UserFlags.MODERATOR | UserFlags.DEVELOPER)) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const { id } = request.params;
      const body = request.body;

      const channel = await channelRepo.updateChannel(id, body);
      if (!channel) {
        return reply.status(404).send(CHANNEL_NOT_FOUND);
      }

      fastify.broadcast({
        type: "CHANNEL_UPDATE",
        payload: channel,
      });

      return reply.send({
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
