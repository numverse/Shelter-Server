import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/redis/userRepo";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { INVALID_OR_EXPIRED_REFRESH_TOKEN, NO_REFRESH_TOKEN, TOKEN_GENERATION_FAILED } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/refresh", {
    schema: {
      response: {
        200: SuccessResponse,
        400: ErrorResponse,
        401: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Auth"],
      summary: "Refresh access token",
      description: "Get a new access token using a refresh token. The refresh token is single-use and a new one will be issued.",
      security: [],
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies?.rt;
      if (!refreshToken) {
        return reply.status(400).send(NO_REFRESH_TOKEN);
      }
      const deviceId = request.headers["x-device-id"] as string;

      const payload = fastify.tokenManager.verifyToken("refresh", refreshToken);
      if (!payload) {
        return reply.status(401).send(INVALID_OR_EXPIRED_REFRESH_TOKEN);
      }

      const userRefreshToken = await userRepo.getRefreshToken(payload.userId, deviceId);
      if (userRefreshToken !== refreshToken) {
        return reply.status(401).send(INVALID_OR_EXPIRED_REFRESH_TOKEN);
      }

      // Invalidate the old refresh token (single-use)
      await userRepo.clearRefreshToken(payload?.userId, deviceId);

      // Generate new tokens
      const tokens = await fastify.tokenManager.createTokens({
        deviceId: deviceId,
        userId: payload.userId,
        email: payload.email,
      });
      if (!tokens) {
        return reply.status(500).send(TOKEN_GENERATION_FAILED);
      }

      return reply.setTokenCookies(tokens.accessToken, tokens.refreshToken).send({ success: true });
    },
  });
};

export default plugin;
