import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";

import { UserResponse } from "src/common/schemas/response";
import { displayNameType, usernameType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.patch("/profile", {
    schema: {
      body: Type.Object({
        username: Type.Optional(usernameType),
        displayName: Type.Optional(displayNameType),
      }),
      response: {
        200: UserResponse,
      },
      tags: ["Users/@me"],
      summary: "Update user profile",
      description: "Update the current user's profile information",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const { username } = request.body;

      if (!username && !("displayName" in request.body)) {
        throw new AppError("MISSING_REQUIRED_FIELDS");
      }

      if (username) {
        const exists = await userRepo.existsUserByUsername(username);
        if (exists) {
          throw new AppError("USERNAME_TAKEN");
        }
      }

      const updatedUser = await userRepo.updateUserProfile(request.userId, request.body);
      if (!updatedUser) {
        throw new AppError("USER_UPDATE_FAILED");
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
