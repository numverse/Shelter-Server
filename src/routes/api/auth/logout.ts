import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/redis/userRepo";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { AUTHENTICATION_REQUIRED } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/logout", {
    schema: {
      response: {
        200: SuccessResponse,
        401: ErrorResponse,
      },
      tags: ["Auth"],
      summary: "Logout user",
      description: "Invalidate the refresh token and clear cookies",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const deviceId = request.headers["x-device-id"] as string;
      await userRepo.clearRefreshToken(request.userId, deviceId);

      return reply
        .clearCookie("at", { path: "/" })
        .clearCookie("rt", { path: "/" })
        .send({ success: true });
    },
  });
};

export default plugin;
