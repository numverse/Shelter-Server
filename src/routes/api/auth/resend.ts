import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { UserFlags } from "src/database/models/userModel";
import * as userRepo from "src/database/repository/userRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { AppError } from "src/common/errors";

import { PROTOCOL, DOMAIN } from "src/config";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/resend", {
    schema: {
      response: {
        201: SuccessResponse,
      },
      tags: ["Auth"],
      summary: "Resend verification email",
      description: "Resend the email verification code to the authenticated user",
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 60 * 1000, // 1 minute
      },
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      if (!fastify.bitFieldManager.match(user.flags, UserFlags.NONE)) {
        throw new AppError("PERMISSION_DENIED");
      }

      const emailToken = fastify.tokenManager.generateToken("email", {
        userId: user.id,
        email: user.email,
      });

      const locale = request.headers["accept-language"]?.split(",")[0] || "en-US";
      const verifyUrl = `${PROTOCOL}://${DOMAIN}/verify#token=${encodeURIComponent(emailToken)}`;

      if (locale.startsWith("ko")) {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: user.email,
          subject: "Shelter 이메일 인증",
          html: `<p>쉘터에 오신 것을 환영합니다!</p>
                 <p>다음 코드를 사용하여 이메일을 인증하세요:</p>
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">이메일 인증하기</a></p>`,
        });
      } else {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: user.email,
          subject: "Verify Email Address for Shelter",
          html: `<p>Welcome to Shelter!</p>
                 <p>Please verify your email by using the following code:</p>
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Verify Email</a></p>`,
        });
      }

      return reply.send({ success: true });
    },
  });
};

export default plugin;
