import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { emailType } from "src/schemas/types";
import * as userRepo from "src/database/repository/userRepo";
import { USER_NOT_FOUND } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/forgot", {
    schema: {
      body: Type.Object({
        email: emailType,
      }),
      response: {
        201: SuccessResponse,
        401: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Auth"],
      summary: "Send password reset email",
      description: "Send the password reset email to the user with the specified email address",
      security: [],
    },
    handler: async (request, reply) => {
      const user = await userRepo.findUserByEmail(request.body.email);

      if (!user) {
        return reply.status(401).send(USER_NOT_FOUND);
      }

      const emailToken = fastify.tokenManager.generateToken("email", {
        userId: user.id,
        email: user.email,
      });

      const locale = request.headers["accept-language"]?.split(",")[0] || "en-US";
      const proto = (request.headers["x-forwarded-proto"] as string) ?? "http";
      const host = request.headers.host ?? "localhost:3000";
      const verifyUrl = `${proto}://${host}/verify#token=${encodeURIComponent(emailToken)}`;

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
