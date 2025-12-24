import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/repository/userRepo";
import { COOKIE_OPTIONS, ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "../../../config";
import { emailType, passwordType, snowflakeType } from "src/schemas/types";
import { ErrorResponse } from "src/schemas/response";
import { INVALID_EMAIL_PASSWORD, TOKEN_GENERATION_FAILED } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/login", {
    schema: {
      body: Type.Object({
        email: emailType,
        password: passwordType,
      }),
      response: {
        200: Type.Object({
          userId: snowflakeType,
        }),
        401: ErrorResponse,
        500: ErrorResponse,
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
        return reply.status(401).send(INVALID_EMAIL_PASSWORD);
      }

      const isValidPassword = await fastify.passwordManager.compare(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send(INVALID_EMAIL_PASSWORD);
      }

      const { accessToken, refreshToken } = await fastify.tokenManager.createTokens({
        userId: user.id,
        email: user.email,
      });
      if (!accessToken || !refreshToken) {
        return reply.status(500).send(TOKEN_GENERATION_FAILED);
      }

      return reply
        .setCookie("at", accessToken, {
          ...COOKIE_OPTIONS,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        })
        .setCookie("rt", refreshToken, {
          ...COOKIE_OPTIONS,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        })
        .status(200).send({ userId: user.id });
    },
  });
};

export default plugin;
