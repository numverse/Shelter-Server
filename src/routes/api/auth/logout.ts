import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/redis/userRepo";
import { SuccessResponse } from "src/schemas/response";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post("/logout", {
    schema: {
      response: {
        200: SuccessResponse,
      },
      tags: ["Auth"],
      summary: "Logout user",
      description: "Invalidate the refresh token and clear cookies",
      security: [],
    },
    handler: async (request, reply) => {
      const refreshToken = request.cookies?.rt;
      const deviceId = request.headers["x-device-id"] as string;

      const payload = fastify.tokenManager.verifyToken("refresh", refreshToken || "");
      if (payload) {
        await userRepo.clearRefreshToken(payload?.userId, deviceId);
      }

      return reply
        .clearCookie("at", { path: "/" })
        .clearCookie("rt", { path: "/" })
        .send({ success: true });
    },
  });
};

export default plugin;
