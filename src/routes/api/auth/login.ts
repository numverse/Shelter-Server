import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";

import { emailType, passwordType, snowflakeType, XDeviceIdHeader } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/login", {
    schema: {
      headers: XDeviceIdHeader,
      body: Type.Object({
        email: emailType,
        password: passwordType,
      }),
      response: {
        200: Type.Object({
          userId: snowflakeType,
        }),
      },
      tags: ["Auth"],
      summary: "Login user",
      description: "Authenticate user with email and password",
      security: [],
    },
    handler: async (request, reply) => {
      const { email, password } = request.body;

      const user = await userRepo.findUserByEmail(email);
      if (!user || !user.password) {
        throw new AppError("INVALID_EMAIL_PASSWORD");
      }

      const isValidPassword = await fastify.passwordManager.compare(password, user.password);
      if (!isValidPassword) {
        throw new AppError("INVALID_EMAIL_PASSWORD");
      }

      const tokens = await fastify.tokenManager.createTokens({
        deviceId: request.headers["x-device-id"],
        userAgent: request.headers["user-agent"] || "unknown",
        ipAddress: request.ip,
        userId: user.id,
        email: user.email,
      });
      if (!tokens) {
        throw new AppError("TOKEN_GENERATION_FAILED");
      }

      return reply.setTokenCookies(tokens.accessToken, tokens.refreshToken).status(200).send({ userId: user.id });
    },
  });
};

export default plugin;
