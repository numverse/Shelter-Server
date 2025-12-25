import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { AUTHENTICATION_REQUIRED, PASSWORD_MISMATCH, INVALID_OR_EXPIRED_VERIFICATION_TOKEN, MISSING_REQUIRED_FIELDS, USER_UPDATE_FAILED } from "src/schemas/errors";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { passwordType } from "src/schemas/types";
import * as userRepo from "src/database/repository/userRepo";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/reset-password", {
    schema: {
      body: Type.Union([
        Type.Object({
          token: Type.String(),
          newPassword: passwordType,
        }),
        Type.Object({
          oldPassword: passwordType,
          newPassword: passwordType,
        }),
      ]),
      response: {
        200: SuccessResponse,
        400: ErrorResponse,
        401: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Auth"],
      summary: "Reset user password",
      description: "Reset the password for a user given a valid reset token",
      security: [],
    },
    handler: async (request, reply) => {
      if ("token" in request.body) {
        const payload = fastify.tokenManager.verifyToken("email", request.body.token);
        if (!payload) {
          return reply.status(400).send(INVALID_OR_EXPIRED_VERIFICATION_TOKEN);
        }
        const hashedPassword = await fastify.passwordManager.hash(request.body.newPassword);
        const success = await userRepo.updateUserPassword(payload.userId, hashedPassword);
        if (!success) {
          return reply.status(500).send(USER_UPDATE_FAILED);
        }
        return reply.send({ success: true });
      } else if ("oldPassword" in request.body) {
        if (!request.user) {
          return reply.status(401).send(AUTHENTICATION_REQUIRED);
        }
        const isMatch = await fastify.passwordManager.compare(request.body.oldPassword, request.user.password);
        if (!isMatch) {
          return reply.status(400).send(PASSWORD_MISMATCH);
        }
        const hashedPassword = await fastify.passwordManager.hash(request.body.newPassword);
        const success = await userRepo.updateUserPassword(request.user.id, hashedPassword);
        if (!success) {
          return reply.status(500).send(USER_UPDATE_FAILED);
        }
        return reply.send({ success: true });
      } else {
        return reply.status(400).send(MISSING_REQUIRED_FIELDS);
      }
    },
  });
};

export default plugin;
