import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { emailType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

import { DOMAIN, PROTOCOL } from "src/config";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/forgot", {
    schema: {
      body: Type.Object({
        email: emailType,
      }),
      response: {
        201: SuccessResponse,
      },
      tags: ["Auth"],
      summary: "Send password reset email",
      description: "Send the password reset email to the user with the specified email address",
      security: [],
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 60 * 1000, // 1 minute
      },
    },
    handler: async (request, reply) => {
      const user = await userRepo.findUserByEmail(request.body.email);

      if (!user) {
        throw new AppError("USER_NOT_FOUND");
      }

      const emailToken = fastify.tokenManager.generateToken("email", {
        userId: user.id,
        email: user.email,
      });

      const locale = request.headers["accept-language"]?.split(",")[0] || "en-US";
      const verifyUrl = `${PROTOCOL}://${DOMAIN}/reset#token=${encodeURIComponent(emailToken)}`;

      if (locale.startsWith("ko")) {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: user.email,
          subject: "Shelter 비밀번호 재설정 요청",
          html: `<h2>안녕하세요 ${user.username},</h2>
                 <p>다음 링크를 사용하여 비밀번호를 재설정하세요:</p>
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">비밀번호 재설정</a></p>`,
        });
      } else {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: user.email,
          subject: "Reset Password Request for Shelter",
          html: `<h2>Hi ${user.username},</h2>
                 <p>Please use the following link to reset your password:</p> 
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Reset Password</a></p>`,
        });
      }

      return reply.send({ success: true });
    },
  });
};

export default plugin;
