import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/repository/userRepo";

import { fileType, snowflakeType } from "src/common/schemas/types";
import { AppError } from "src/common/errors";
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
      },
      tags: ["Users/@me"],
      summary: "Upload avatar",
      description: "Upload or update the current user's avatar image",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const data = await request.file();

      if (!data) {
        throw new AppError("MISSING_REQUIRED_FIELDS");
      }

      const mimeType = data.mimetype;
      if (!mimeType.startsWith("image/")) {
        throw new AppError("FILE_MUST_BE_IMAGE");
      }

      // Read file buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Check file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw new AppError("FILE_TOO_LARGE");
      }

      // Get current user to check for existing avatar
      const user = await userRepo.findUserById(request.userId);
      if (!user) {
        throw new AppError("USER_NOT_FOUND");
      }

      // Delete old avatar if exists
      if (user.avatarId) {
        await userRepo.deleteAvatar(user.avatarId);
      }

      // Upload new avatar
      const avatarId = new Types.ObjectId();
      await userRepo.uploadAvatar(avatarId, buffer, mimeType);

      // Update user profile with new avatarId
      const updatedUser = await userRepo.updateUserProfile(request.userId, { avatarId });
      if (!updatedUser) {
        throw new AppError("USER_UPDATE_FAILED");
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
      },
      tags: ["Users/@me"],
      summary: "Delete avatar",
      description: "Delete the current user's avatar",
    },
    handler: async (request, reply) => {
      const user = request.userId ? await userRepo.findUserById(request.userId) : null;
      if (!user) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      if (!user.avatarId) {
        throw new AppError("AVATAR_NOT_FOUND");
      }

      // Delete avatar from GridFS
      await userRepo.deleteAvatar(user.avatarId);

      // Update user profile to remove avatarId
      const updatedUser = await userRepo.updateUserProfile(user.id, { avatarId: null });
      if (!updatedUser) {
        throw new AppError("USER_UPDATE_FAILED");
      }

      return reply.status(204).send();
    },
  });
};

export default plugin;
