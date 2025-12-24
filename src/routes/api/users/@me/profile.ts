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
      if (!request.user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { username, displayName } = request.body;

      if (!username && !displayName) {
        return reply.status(400).send(MISSING_REQUIRED_FIELDS);
      }

      if (username) {
        const existingUser = await userRepo.findUserByUsername(username);
        if (existingUser && existingUser.id !== request.user.id) {
          return reply.status(400).send(USERNAME_TAKEN);
        }
      }

      const updatedUser = await userRepo.updateUserProfile(request.user.id, { username, displayName });
      if (!updatedUser) {
        return reply.status(500).send(USER_UPDATE_FAILED);
      }

      return reply.send({
        id: request.user.id,
        username: request.user.username,
        displayName: request.user.displayName,
        email: request.user.email,
        flags: request.user.flags,
        emojiPacks: request.user.emojiPacks,
        avatarId: request.user.avatarId?.toString(),
        createdAt: request.user.createdAt.toISOString(),
        updatedAt: request.user.updatedAt?.toISOString(),
      });
    },
  });
};

export default plugin;
