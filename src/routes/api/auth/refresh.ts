import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/redis/userRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { XDeviceIdHeader } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/refresh", {
    schema: {
      headers: XDeviceIdHeader,
      response: {
        200: SuccessResponse,
      },
      tags: ["Auth"],
      summary: "Refresh access token",
      description: "Get a new access token using a refresh token. The refresh token is single-use and a new one will be issued.",
      security: [],
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies?.rt;
      if (!refreshToken) {
        throw new AppError("NO_REFRESH_TOKEN");
      }
      const deviceId = request.headers["x-device-id"];

      const payload = fastify.tokenManager.verifyToken("refresh", refreshToken);
      if (!payload) {
        throw new AppError("INVALID_OR_EXPIRED_REFRESH_TOKEN");
      }

      const userRefreshToken = await userRepo.getRefreshToken(payload.userId, deviceId);
      if (userRefreshToken !== refreshToken) {
        throw new AppError("INVALID_OR_EXPIRED_REFRESH_TOKEN");
      }

      // Invalidate the old refresh token (single-use)
      await userRepo.clearRefreshToken(payload?.userId, deviceId);

      // Generate new tokens
      const tokens = await fastify.tokenManager.createTokens({
        deviceId: deviceId,
        userAgent: request.headers["user-agent"] || "unknown",
        ipAddress: request.ip,
        userId: payload.userId,
        email: payload.email,
      });
      if (!tokens) {
        throw new AppError("TOKEN_GENERATION_FAILED");
      }

      return reply.setTokenCookies(tokens.accessToken, tokens.refreshToken).send({ success: true });
    },
  });
};

export default plugin;
