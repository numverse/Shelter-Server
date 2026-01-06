import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { UserFlags } from "src/database/models/userModel";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/verify-email", {
    schema: {
      body: Type.Object({
        token: Type.String({ minLength: 1 }),
      }),
      response: {
        201: SuccessResponse,
      },
      tags: ["Auth"],
      summary: "Verify email address",
      description: "Verify a user's email address using a verification code",
      security: [],
    },
    handler: async (request, reply) => {
      const { token } = request.body;
      const deviceId = request.headers["x-device-id"] as string;

      const payload = fastify.tokenManager.verifyToken("email", token);
      if (!payload) {
        throw new AppError("INVALID_OR_EXPIRED_VERIFICATION_TOKEN");
      }

      const user = await userRepo.findUserById(payload.userId);
      if (!user) {
        throw new AppError("USER_NOT_FOUND");
      }
      if (user.email !== payload.email) {
        throw new AppError("INVALID_OR_EXPIRED_VERIFICATION_TOKEN");
      }

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

      const updatedUser = await userRepo.updateUser(payload.userId, {
        flags: UserFlags.MEMBER,
      });
      if (!updatedUser) {
        throw new AppError("USER_UPDATE_FAILED");
      }

      return reply.setTokenCookies(tokens.accessToken, tokens.refreshToken).send({ success: true });
    },
  });
};

export default plugin;
