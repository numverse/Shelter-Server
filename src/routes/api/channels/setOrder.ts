import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as channelRepo from "src/database/repository/channelRepo";
import * as userRepo from "src/database/repository/userRepo";
import { UserFlags } from "src/database/models/userModel";

import { SuccessResponse } from "src/common/schemas/response";
import { snowflakeType, channelPositionType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

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
      },
      tags: ["Channels"],
      summary: "Set channel order",
      description: "Update the order of channels",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }
      const userAllowed = await userRepo.hasAnyUserFlags(request.userId, UserFlags.MODERATOR);
      if (!userAllowed) {
        throw new AppError("PERMISSION_DENIED");
      }

      const channel = await channelRepo.setChannelOrder(...request.body);
      if (!channel) {
        throw new AppError("CHANNEL_UPDATE_FAILED");
      }

      request.body.forEach((c) => {
        fastify.broadcast({
          type: "CHANNEL_UPDATE",
          payload: {
            id: c.channelId,
            position: c.position,
            parentId: c.parentId,
          },
        });
      });
      return reply.send({ success: true });
    },
  });
};

export default plugin;
