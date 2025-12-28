import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "src/database/repository/userRepo";
import { generateSnowflake } from "src/utils/snowflake";
import { displayNameType, emailType, passwordType, usernameType } from "src/schemas/types";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { EMAIL_EXISTS, REGISTRATION_FAILED, TOKEN_GENERATION_FAILED, USERNAME_TAKEN } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/register", {
    schema: {
      body: Type.Object({
        email: emailType,
        password: passwordType,
        username: usernameType,
        displayName: Type.Optional(displayNameType),
      }),
      response: {
        201: SuccessResponse,
        400: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Auth"],
      summary: "Register a new user",
      description: "Create a new user account with email, password, and username",
      security: [],
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 60 * 1000, // 1 minute
      },
    },
    handler: async (request, reply) => {
      const { email, password, username, displayName } = request.body;

      if (/^user_\d+$/.test(username)) {
        return reply.status(400).send(USERNAME_TAKEN);
      }

      if (await userRepo.existsUserByEmail(email)) {
        return reply.status(400).send(EMAIL_EXISTS);
      }

      const hashedPassword = await fastify.passwordManager.hash(password);
      const userId = generateSnowflake();

      const verificationCode = fastify.tokenManager.generateToken("email", {
        userId,
        email,
      });

      const user = await userRepo.createUser({
        id: userId,
        email: email,
        password: hashedPassword,
        username: username,
        displayName: displayName,
      });
      if (!user) {
        return reply.status(500).send(REGISTRATION_FAILED);
      }

      const tokens = await fastify.tokenManager.createTokens({
        deviceId: request.headers["x-device-id"] as string,
        userId: user.id,
        email: user.email,
      });
      if (!tokens) {
        return reply.status(500).send(TOKEN_GENERATION_FAILED);
      }

      const locale = request.headers["accept-language"]?.split(",")[0] || "en-US";
      const proto = (request.headers["x-forwarded-proto"] as string) ?? "http";
      const host = request.headers.host ?? "localhost:3000";
      const verifyUrl = `${proto}://${host}/verify#token=${encodeURIComponent(verificationCode)}`;

      if (locale.startsWith("ko")) {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: email,
          subject: "쉘터 이메일 인증",
          html: `<p>쉘터에 오신 것을 환영합니다!</p>
                 <p>다음 코드를 사용하여 이메일을 인증하세요:</p>
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">이메일 인증하기</a></p>`,
        });
      } else {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: email,
          subject: "Verify Email Address for Shelter",
          html: `<p>Welcome to Shelter!</p>
                 <p>Please verify your email by using the following code:</p>
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Verify Email</a></p>`,
        });
      }

      return reply.setTokenCookies(tokens.accessToken, tokens.refreshToken).send({ success: true });
    },
  });
};

export default plugin;
