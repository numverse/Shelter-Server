import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import path from "path";
import { generateSnowflake } from "../../../utils/snowflake";
import * as emojiPackRepo from "../../../database/repository/emojiPackRepo";
import { EmojiPackResponse, ErrorResponse } from "src/schemas/response";
import { AUTHENTICATION_REQUIRED, MISSING_REQUIRED_FIELDS, EMOJI_PACK_CREATION_FAILED, EMOJI_LIMIT_EXCEEDED } from "src/schemas/errors";
import { fileType, emojiPackNameType, emojiNameType } from "src/schemas/types";

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
        401: ErrorResponse,
        400: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ["Emoji Packs"],
      summary: "Create an emoji pack",
      description: "Create a new emoji pack with uploaded images",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
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
        return reply.status(400).send(MISSING_REQUIRED_FIELDS);
      }

      if (files.length > 50) {
        return reply.status(400).send(EMOJI_LIMIT_EXCEEDED);
      }

      const emojis = files.map((file, index) => {
        let emojiName: string;
        if (emojiNames[index]?.trim()) {
          emojiName = emojiNames[index].replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
        } else {
          const baseName = path.basename(file.originalname, path.extname(file.originalname));
          emojiName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
        }

        const emojiId = generateSnowflake();

        return {
          id: emojiId,
          name: emojiName,
          mimeType: file.mimeType,
          buffer: file.buffer,
        };
      });

      const pack = await emojiPackRepo.createEmojiPack({
        id: generateSnowflake(),
        name,
        creatorId: request.userId,
        emojis,
      });
      if (!pack) {
        return reply.status(500).send(EMOJI_PACK_CREATION_FAILED);
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
