import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "src/database/repository/userRepo";
import { ErrorResponse, SuccessResponse } from "src/schemas/response";
import { INVALID_OR_EXPIRED_VERIFICATION_CODE, USER_NOT_FOUND, USER_UPDATE_FAILED } from "src/schemas/errors";
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

      const payload = fastify.tokenManager.verifyToken("email", token);
      if (!payload) {
        return reply.status(400).send(INVALID_OR_EXPIRED_VERIFICATION_CODE);
      }

      const user = await userRepo.findUserById(payload.userId);
      if (!user) {
        return reply.status(400).send(USER_NOT_FOUND);
      }

      if (user.email !== payload.email) {
        return reply.status(400).send(INVALID_OR_EXPIRED_VERIFICATION_CODE);
      }

      const query: {
        username?: string;
        displayName?: string;
        flags: UserFlags;
      } = {
        flags: UserFlags.MEMBER,
      };

      if (user.displayName && await userRepo.existsUserByUsername(user.displayName).then((r) => !r)) {
        query["username"] = user.displayName;
        query["displayName"] = undefined;
      }

      const updatedUser = await userRepo.updateUser(payload.userId, query);
      if (!updatedUser) {
        return reply.status(500).send(USER_UPDATE_FAILED);
      }

      return reply.send({ success: true });
    },
  });
};

export default plugin;
