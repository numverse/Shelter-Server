import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import path from "path";
import { generateSnowflake } from "../../../utils/snowflake";
import * as emojiPackRepo from "../../../database/repository/emojiPackRepo";
import { EmojiPackResponse, ErrorResponse } from "src/schemas/response";
import { emojiPackNameType, emojiNameType, fileType, snowflakeType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, EMOJI_LIMIT_EXCEEDED, EMOJI_PACK_NOT_FOUND, EMOJI_PACK_REQUIRES_EMOJI, EMOJI_PACK_UPDATE_FAILED, MISSING_REQUIRED_FIELDS, PERMISSION_DENIED } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.put("/:id", {
    schema: {
      consumes: ["multipart/form-data"],
      contentType: "multipart/form-data",
      body: Type.Object({
        name: emojiPackNameType,
        emojiNames: emojiNameType,
        existingEmojiIds: snowflakeType,
        existingEmojiNames: emojiNameType,
        files: fileType,
      }),
      response: {
        200: EmojiPackResponse,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      params: Type.Object({
        id: snowflakeType,
      }),
      tags: ["Emoji Packs"],
      summary: "Update an emoji pack",
      description: "Update an existing emoji pack",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const { id } = request.params;
      const pack = await emojiPackRepo.findEmojiPackById(id);
      if (!pack) {
        return reply.status(404).send(EMOJI_PACK_NOT_FOUND);
      }

      // Check permission: creator only
      if (pack.creatorId !== request.userId) {
        return reply.status(403).send(PERMISSION_DENIED);
      }

      let name: string | undefined;
      const emojiNames: string[] = [];
      const existingEmojiIds: string[] = [];
      const existingEmojiNames: string[] = [];
      const files: { originalname: string; buffer: Buffer; mimeType: string }[] = [];

      // Process multipart data
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          files.push({
            originalname: part.filename,
            buffer,
            mimeType: part.mimetype || "image/png",
          });
        } else if (part.fieldname === "emojiNames") {
          emojiNames.push(String(part.value));
        } else if (part.fieldname === "name") {
          name = String(part.value);
        } else if (part.fieldname === "existingEmojiIds") {
          existingEmojiIds.push(String(part.value));
        } else if (part.fieldname === "existingEmojiNames") {
          existingEmojiNames.push(String(part.value));
        }
      }

      if (existingEmojiIds.length !== existingEmojiNames.length
        || emojiNames.length !== files.length) {
        return reply.status(400).send(MISSING_REQUIRED_FIELDS);
      }

      // Parse existing emojis (ones to keep with updated names)
      let existingEmojis = existingEmojiIds.map((id, index) => ({
        id,
        name: existingEmojiNames[index],
      }));

      // Find deleted emoji IDs (emojis that exist in pack but not in existingEmojis)
      const deletedEmojiIds = pack.emojis
        .filter((e) => !existingEmojiIds.includes(e.id))
        .map((e) => e.id);

      // Build updated emojis array
      const updatedEmojis: { id: string; name: string; mimeType?: string; buffer?: Buffer }[] = [];

      // Keep existing emojis with updated names
      for (const existing of existingEmojis) {
        const originalEmoji = pack.emojis.find((e) => e.id === existing.id);
        if (originalEmoji) {
          updatedEmojis.push({
            id: originalEmoji.id,
            name: existing.name.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || originalEmoji.name,
          });
        }
      }

      // Add new emojis from uploaded files
      files.forEach((file, index) => {
        let emojiName: string;
        if (emojiNames[index] && emojiNames[index].trim()) {
          emojiName = emojiNames[index].replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
        } else {
          const baseName = path.basename(file.originalname, path.extname(file.originalname));
          emojiName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
        }

        const emojiId = generateSnowflake();

        updatedEmojis.push({
          id: emojiId,
          name: emojiName,
          mimeType: file.mimeType,
          buffer: file.buffer,
        });
      });

      if (updatedEmojis.length === 0) {
        return reply.status(400).send(EMOJI_PACK_REQUIRES_EMOJI);
      }

      if (updatedEmojis.length > 50) {
        return reply.status(400).send(EMOJI_LIMIT_EXCEEDED);
      }

      const updatedPack = await emojiPackRepo.updateEmojiPack(id, {
        name,
        emojis: updatedEmojis,
        deletedEmojiIds,
      });
      if (!updatedPack) {
        return reply.status(500).send(EMOJI_PACK_UPDATE_FAILED);
      }

      // Return pack without buffer
      const packResponse = {
        ...updatedPack,
        createdAt: updatedPack.createdAt.toISOString(),
        updatedAt: updatedPack.updatedAt?.toISOString(),
      };
      return reply.send(packResponse);
    },
  });
};

export default plugin;
