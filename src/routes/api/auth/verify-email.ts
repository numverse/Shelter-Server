import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "src/database/repository/userRepo";
import { setRefreshToken } from "src/database/redis/userRepo";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { INVALID_OR_EXPIRED_VERIFICATION_TOKEN, TOKEN_GENERATION_FAILED, USER_NOT_FOUND, USER_UPDATE_FAILED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/verify-email", {
    schema: {
      body: Type.Object({
        token: Type.String({ minLength: 1 }),
      }),
      response: {
        201: SuccessResponse,
        400: ErrorResponse,
        500: ErrorResponse,
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
        return reply.status(400).send(INVALID_OR_EXPIRED_VERIFICATION_TOKEN);
      }

      const user = await userRepo.findUserById(payload.userId);
      if (!user) {
        return reply.status(400).send(USER_NOT_FOUND);
      }

      if (user.email !== payload.email) {
        return reply.status(400).send(INVALID_OR_EXPIRED_VERIFICATION_TOKEN);
      }

      const tokens = await fastify.tokenManager.createTokens({
        deviceId: deviceId,
        userId: user.id,
        email: user.email,
      });
      if (!tokens) {
        return reply.status(500).send(TOKEN_GENERATION_FAILED);
      }

      const updatedUser = await userRepo.updateUser(payload.userId, {
        flags: UserFlags.MEMBER,
      });
      if (!updatedUser) {
        return reply.status(500).send(USER_UPDATE_FAILED);
      }

      return reply.setTokenCookies(tokens.accessToken, tokens.refreshToken).send({ success: true });
    },
  });
};

export default plugin;
