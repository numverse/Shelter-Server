import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as channelRepo from "../../../database/repository/channelRepo";
import * as userRepo from "../../../database/repository/userRepo";
import { ErrorResponse, SuccessResponse } from "../../../schemas/response";
import { snowflakeType, channelPositionType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, CHANNEL_UPDATE_FAILED, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch("/", {
    schema: {
      body: Type.Array(Type.Object({
        channelId: snowflakeType,
        position: channelPositionType,
        parentId: Type.Optional(snowflakeType),
      })),
      response: {
        200: SuccessResponse,
        403: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Channels"],
      summary: "Set channel order",
      description: "Update the order of channels",
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

      const channel = await channelRepo.setChannelOrder(...request.body);
      if (!channel) {
        return reply.status(500).send(CHANNEL_UPDATE_FAILED);
      }

      fastify.broadcast({
        type: "MULTIPLE_CHANNEL_UPDATE",
        payload: request.body.map((item) => ({
          id: item.channelId,
          position: item.position,
          parentId: item.parentId,
        })),
      });
      return reply.send({ success: true });
    },
  });
};

export default plugin;
