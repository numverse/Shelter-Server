import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../../database/repository/userRepo";
import { ErrorResponse } from "../../../../schemas/response";
import { AUTHENTICATION_REQUIRED, AVATAR_NOT_FOUND, FILE_MUST_BE_IMAGE, FILE_TOO_LARGE, MISSING_REQUIRED_FIELDS, USER_NOT_FOUND, USER_UPDATE_FAILED } from "src/schemas/errors";
import { fileType, snowflakeType } from "src/schemas/types";
import { Types } from "mongoose";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Upload avatar
  fastify.put("/avatar", {
    attachValidation: false,
    schema: {
      consumes: ["multipart/form-data"],
      body: Type.Object({
        file: fileType,
      }),
      response: {
        200: {
          avatarId: snowflakeType,
        },
        400: ErrorResponse,
        401: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Users/@me"],
      summary: "Upload avatar",
      description: "Upload or update the current user's avatar image",
    },
    handler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const data = await request.file();

      if (!data) {
        return reply.status(400).send(MISSING_REQUIRED_FIELDS);
      }

      const mimeType = data.mimetype;
      if (!mimeType.startsWith("image/")) {
        return reply.status(400).send(FILE_MUST_BE_IMAGE);
      }

      // Read file buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Check file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send(FILE_TOO_LARGE);
      }

      // Get current user to check for existing avatar
      const user = await userRepo.findUserById(request.user.id);
      if (!user) {
        return reply.status(404).send(USER_NOT_FOUND);
      }

      // Delete old avatar if exists
      if (user.avatarId) {
        await userRepo.deleteAvatar(user.avatarId);
      }

      // Upload new avatar
      const avatarId = new Types.ObjectId();
      await userRepo.uploadAvatar(avatarId, buffer, mimeType);

      // Update user profile with new avatarId
      const updatedUser = await userRepo.updateUserProfile(request.user.id, { avatarId });
      if (!updatedUser) {
        return reply.status(500).send(USER_UPDATE_FAILED);
      }

      return reply.send({
        avatarId: updatedUser.avatarId?.toString(),
      });
    },
  });

  // Delete avatar
  fastify.delete("/avatar", {
    schema: {
      response: {
        204: Type.Null(),
        401: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Users/@me"],
      summary: "Delete avatar",
      description: "Delete the current user's avatar",
    },
    handler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      if (!request.user.avatarId) {
        return reply.status(404).send(AVATAR_NOT_FOUND);
      }

      // Delete avatar from GridFS
      await userRepo.deleteAvatar(request.user.avatarId);

      // Update user profile to remove avatarId
      const updatedUser = await userRepo.updateUserProfile(request.user.id, { avatarId: null });
      if (!updatedUser) {
        return reply.status(500).send(USER_UPDATE_FAILED);
      }

      return reply.status(204).send();
    },
  });
};

export default plugin;
