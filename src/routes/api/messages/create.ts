import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { generateSnowflake } from "../../../utils/snowflake";
import * as messageRepo from "../../../database/repository/messageRepo";
import * as fileRepo from "../../../database/repository/fileRepo";
import type { IAttachment } from "../../../database/models/messageModel";
import { fileType, messageContentType, snowflakeType } from "src/schemas/types";
import { AUTHENTICATION_REQUIRED, FILE_TOO_LARGE, MISSING_REQUIRED_FIELDS } from "src/schemas/errors";
import { MessageResponse, ErrorResponse } from "src/schemas/response";

// 50MB max file size
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/", {
    schema: {
      consumes: ["multipart/form-data"],
      body: Type.Object({
        channelId: snowflakeType,
        content: messageContentType,
        replyTo: Type.Optional(snowflakeType),
        files: Type.Optional(fileType),
      }),
      response: {
        201: MessageResponse,
        400: ErrorResponse,
        401: ErrorResponse,
      },
      tags: ["Messages"],
      summary: "Create a new message",
      description: "Send a new message to a channel",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const fields: Record<string, string> = {};
      const attachments: IAttachment[] = [];

      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          const chunks: Buffer[] = [];
          let size = 0;

          for await (const chunk of part.file) {
            size += chunk.length;
            if (size > MAX_FILE_SIZE) {
              return reply.status(400).send(FILE_TOO_LARGE);
            }
            chunks.push(chunk);
          }

          const buffer = Buffer.concat(chunks);
          const mimeType = part.mimetype || "application/octet-stream";
          const fileId = generateSnowflake();

          // Save file to GridFS
          await fileRepo.createFile({
            id: fileId,
            filename: part.filename,
            mimeType,
            size: buffer.length,
            buffer,
            uploaderId: fields.userId || "",
          });

          attachments.push({
            id: fileId,
            filename: part.filename,
            mimeType,
            size: buffer.length,
          });
        } else {
          fields[part.fieldname] = String((part as { value: unknown }).value);
        }
      }

      const { channelId, content, replyTo } = fields;

      if (!channelId || (!content && attachments.length === 0)) {
        return reply.status(400).send(MISSING_REQUIRED_FIELDS);
      }

      const message = await messageRepo.createMessage({
        id: generateSnowflake(),
        channelId,
        content: content || "",
        authorId: request.userId,
        replyTo,
        attachments,
      });

      fastify.broadcast({ type: "MESSAGE_CREATE", payload: message });
      return reply.status(201).send({
        ...message,
        updatedAt: message.updatedAt?.toISOString(),
        createdAt: message.createdAt.toISOString(),
      });
    },
  });
};

export default plugin;
