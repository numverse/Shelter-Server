import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import * as userRepo from "src/database/redis/userRepo";

import { AppError } from "src/common/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/devices", {
    schema: {
      response: {
        200: Type.Array(Type.Object({
          hashedDeviceId: Type.String(),
          userAgent: Type.String(),
          ipAddress: Type.Union([
            Type.String({ format: "ipv4" }),
            Type.String({ format: "ipv6" }),
          ]),
          lastUsedTime: Type.String({ format: "date-time" }),
        })),
      },
      tags: ["Auth"],
      summary: "Get All Devices",
      description: "Retrieve all devices associated with the authenticated user's account.",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        throw new AppError("AUTHENTICATION_REQUIRED");
      }

      const devices = await userRepo.getAllDevices(request.userId);

      return reply.send(devices);
    },
  });
};

export default plugin;
