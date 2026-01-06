import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";

import { SuccessResponse } from "src/common/schemas/response";
import { passwordType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

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
          throw new AppError("INVALID_OR_EXPIRED_VERIFICATION_TOKEN");
        }
        const hashedPassword = await fastify.passwordManager.hash(request.body.newPassword);
        const success = await userRepo.updateUserPassword(payload.userId, hashedPassword);
        if (!success) {
          throw new AppError("USER_UPDATE_FAILED");
        }
        return reply.send({ success: true });
      } else if ("oldPassword" in request.body) {
        const user = request.userId ? await userRepo.findUserById(request.userId) : null;
        if (!user) {
          throw new AppError("AUTHENTICATION_REQUIRED");
        }
        const isMatch = await fastify.passwordManager.compare(request.body.oldPassword, user.password);
        if (!isMatch) {
          throw new AppError("PASSWORD_MISMATCH");
        }
        const hashedPassword = await fastify.passwordManager.hash(request.body.newPassword);
        const success = await userRepo.updateUserPassword(user.id, hashedPassword);
        if (!success) {
          throw new AppError("USER_UPDATE_FAILED");
        }
        return reply.send({ success: true });
      } else {
        throw new AppError("MISSING_REQUIRED_FIELDS");
      }
    },
  });
};

export default plugin;
