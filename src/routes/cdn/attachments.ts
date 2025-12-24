import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as fileRepo from "../../database/repository/fileRepo";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  // Inline view
  fastify.get("/attachments/:id", {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
      tags: ["CDN"],
      summary: "Download file (inline)",
      description: "Get file content for inline viewing",
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const file = await fileRepo.findFileById(id);
      if (!file) {
        return reply.status(404).send({ error: "file_not_found" });
      }

      const stream = fileRepo.getFileStream(id);

      reply.header("Content-Type", file.mimeType);
      reply.header("Content-Length", file.size);
      reply.header("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
      reply.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

      return reply.send(stream);
    },
  });

  // Download as attachment
  fastify.get("/attachments/:id/download", {
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
      tags: ["CDN"],
      summary: "Download file (attachment)",
      description: "Download file as attachment",
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const file = await fileRepo.findFileById(id);
      if (!file) {
        return reply.status(404).send({ error: "file_not_found" });
      }

      const stream = fileRepo.getFileStream(id);

      reply.header("Content-Type", file.mimeType);
      reply.header("Content-Length", file.size);
      reply.header("Content-Disposition", `attachment; filename="${encodeURIComponent(file.filename)}"`);

      return reply.send(stream);
    },
  });
};

export default plugin;
