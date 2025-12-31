import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as channelRepo from "../../../database/repository/channelRepo";
import * as messageRepo from "../../../database/repository/messageRepo";
import * as userRepo from "../../../database/repository/userRepo";
import { ErrorResponse, SuccessResponse } from "../../../schemas/response";
import { snowflakeType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, CHANNEL_NOT_FOUND, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.delete("/:id", {
    schema: {
      params: Type.Object({ id: snowflakeType }),
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
        return reply.status(403).send(AUTHENTICATION_REQUIRED);
      }
      const userAllowed = await userRepo.hasAnyUserFlags(request.userId,
        UserFlags.MODERATOR, UserFlags.DEVELOPER);
      if (!userAllowed) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      const { id } = request.params;

      await messageRepo.deleteMessagesByChannel(id);

      const deleted = await channelRepo.deleteChannel(id);
      if (!deleted) {
        return reply.status(404).send(CHANNEL_NOT_FOUND);
      }

      fastify.broadcast({
        type: "CHANNEL_DELETE",
        payload: {
          channelId: id,
        },
      });

      return reply.status(204).send({ success: true });
    },
  });
};

export default plugin;
