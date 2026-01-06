import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import path from "path";

import * as emojiPackRepo from "src/database/repository/emojiPackRepo";

import { fileType, emojiPackNameType, emojiNameType } from "src/common/schemas/types";
import { EmojiPackResponse } from "src/common/schemas/response";
import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/", {
    schema: {
      consumes: ["multipart/form-data"],
      contentType: "multipart/form-data",
      body: Type.Object({
        name: emojiPackNameType,
        emojiNames: emojiNameType,
        files: fileType,
      }),
      response: {
        201: EmojiPackResponse,
      },
      tags: ["Emoji Packs"],
      summary: "Create an emoji pack",
      description: "Create a new emoji pack with uploaded images",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      let name = "";
      let emojiNames: string[] = [];
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
        }
      }

      if (!name || files.length === 0 || files.length !== emojiNames.length) {
        throw new AppError("MISSING_REQUIRED_FIELDS");
      }

      if (files.length > 50) {
        throw new AppError("EMOJI_LIMIT_EXCEEDED");
      }

      const emojis = files.map((file, index) => {
        let emojiName: string;
        if (emojiNames[index]?.trim()) {
          emojiName = emojiNames[index].replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
        } else {
          const baseName = path.basename(file.originalname, path.extname(file.originalname));
          emojiName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
        }

        const emojiId = fastify.snowflake.generate();

        return {
          id: emojiId,
          name: emojiName,
          mimeType: file.mimeType,
          buffer: file.buffer,
        };
      });

      const pack = await emojiPackRepo.createEmojiPack({
        id: fastify.snowflake.generate(),
        name,
        creatorId: request.userId,
        emojis,
      });
      if (!pack) {
        throw new AppError("EMOJI_PACK_CREATION_FAILED");
      }

      return reply.status(201).send({
        ...pack,
        updatedAt: pack.updatedAt?.toISOString(),
        createdAt: pack.createdAt.toISOString(),
      });
    },
  });
};

export default plugin;
