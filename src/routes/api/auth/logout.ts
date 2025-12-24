import { type FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import * as userRepo from "../../../database/repository/userRepo";
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

      if (refreshToken) {
        const user = await userRepo.findUserByRefreshToken(refreshToken);
        if (user) {
          await userRepo.clearRefreshToken(user.id);
        }
      }

      return reply
        .clearCookie("at", { path: "/" })
        .clearCookie("rt", { path: "/" })
        .send({ success: true });
    },
  });
};

export default plugin;
