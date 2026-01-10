import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as channelRepo from "src/database/repository/channelRepo";
import * as messageRepo from "src/database/repository/messageRepo";
import * as userRepo from "src/database/repository/userRepo";
import { UserFlags } from "src/database/models/userModel";

import { ErrorResponse, SuccessResponse } from "src/common/schemas/response";
import { snowflakeType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete("/:channelId", {
    schema: {
      params: Type.Object({ channelId: snowflakeType }),
      response: {
        204: SuccessResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      tags: ["Channels"],
      summary: "Delete a channel",
      description: "Delete a channel by ID",
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

      await messageRepo.deleteMessagesByChannel(channelId);

      const deleted = await channelRepo.deleteChannel(channelId);
      if (!deleted) {
        throw new AppError("CHANNEL_NOT_FOUND");
      }

      fastify.broadcast({
        type: "CHANNEL_DELETE",
        payload: {
          channelId: channelId,
        },
      });

      return reply.status(204).send({ success: true });
    },
  });
};

export default plugin;
