import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { AUTHENTICATION_REQUIRED, PERMISSION_DENIED } from "src/schemas/errors";
import { UserFlags } from "src/database/models/userModel";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/resend", {
    schema: {
      response: {
        201: SuccessResponse,
        401: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Auth"],
      summary: "Resend verification email",
      description: "Resend the email verification code to the authenticated user",
    },
    handler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      if (!fastify.bitFieldManager.match(request.user.flags, UserFlags.NONE)) {
        return reply.status(401).send(PERMISSION_DENIED);
      }

      const emailToken = fastify.tokenManager.generateToken("email", {
        userId: request.user.id,
        email: request.user.email,
      });

      const locale = request.headers["accept-language"]?.split(",")[0] || "en-US";
      const proto = (request.headers["x-forwarded-proto"] as string) ?? "http";
      const host = request.headers.host ?? "localhost:3000";
      const verifyUrl = `${proto}://${host}/verify#token=${encodeURIComponent(emailToken)}`;

      if (locale.startsWith("ko")) {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: request.user.email,
          subject: "Shelter 이메일 인증",
          html: `<p>쉘터에 오신 것을 환영합니다!</p>
                 <p>다음 코드를 사용하여 이메일을 인증하세요:</p>
                 <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">이메일 인증하기</a></p>`,
        });
      } else {
        await fastify.mailer.sendMail({
          from: "\"Shelter\" <noreply@shelter.zero624.dev>",
          to: request.user.email,
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
