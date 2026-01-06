import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/redis/userRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { XDeviceIdHeader } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/logout", {
    schema: {
      headers: XDeviceIdHeader,
      response: {
        200: SuccessResponse,
      },
      tags: ["Auth"],
      summary: "Logout user",
      description: "Invalidate the refresh token and clear cookies",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const deviceId = request.headers["x-device-id"];
      await userRepo.clearRefreshToken(request.userId, deviceId);

      return reply
        .clearCookie("at", { path: "/" })
        .clearCookie("rt", { path: "/" })
        .send({ success: true });
    },
  });
};

export default plugin;
