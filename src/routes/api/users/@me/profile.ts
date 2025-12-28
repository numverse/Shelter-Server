import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../../database/repository/userRepo";
import { ErrorResponse, UserResponse } from "../../../../schemas/response";
import { AUTHENTICATION_REQUIRED, MISSING_REQUIRED_FIELDS, USER_UPDATE_FAILED, USERNAME_TAKEN } from "src/schemas/errors";
import { displayNameType, usernameType } from "src/schemas/types";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch("/profile", {
    schema: {
      body: Type.Object({
        username: Type.Optional(usernameType),
        displayName: Type.Optional(displayNameType),
      }),
      response: {
        200: UserResponse,
        401: ErrorResponse,
        400: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Users/@me"],
      summary: "Update user profile",
      description: "Update the current user's profile information",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { username } = request.body;

      if (!username && !("displayName" in request.body)) {
        return reply.status(400).send(MISSING_REQUIRED_FIELDS);
      }

      if (username) {
        const exists = await userRepo.existsUserByUsername(username);
        if (exists) {
          return reply.status(400).send(USERNAME_TAKEN);
        }
      }

      const updatedUser = await userRepo.updateUserProfile(request.userId, request.body);
      if (!updatedUser) {
        return reply.status(500).send(USER_UPDATE_FAILED);
      }

      return reply.send({
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        flags: updatedUser.flags,
        emojiPacks: updatedUser.emojiPacks,
        avatarId: updatedUser.avatarId?.toString(),
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
