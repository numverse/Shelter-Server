import { Type, type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/redis/userRepo";
import { ErrorResponse } from "src/schemas/response";
import { AUTHENTICATION_REQUIRED } from "src/schemas/errors";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/devices", {
    schema: {
      response: {
        200: Type.Array(Type.Object({
          deviceId: Type.String(),
          userAgent: Type.String(),
          ipAddress: Type.Union([
            Type.String({ format: "ipv4" }),
            Type.String({ format: "ipv6" }),
          ]),
          lastUsedTime: Type.String({ format: "date-time" }),
        })),
        401: ErrorResponse,
      },
      tags: ["Auth"],
      summary: "Get All Devices",
      description: "Retrieve all devices associated with the authenticated user's account.",
    },
    handler: async (request, reply) => {
      if (!request.userId) {
        return reply.status(401).send(AUTHENTICATION_REQUIRED);
      }

      const devices = await userRepo.getAllDevices(request.userId);

      return reply.send(devices);
    },
  });
};

export default plugin;
