import fp from "fastify-plugin";
import { IUser } from "src/database/models/userModel";
import * as userRepo from "src/database/repository/userRepo";
import { COOKIE_OPTIONS, ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "../../config";
import { INVALID_OR_EXPIRED_REFRESH_TOKEN, INVALID_USER_TOKEN } from "src/schemas/errors";

declare module "fastify" {
  export interface FastifyRequest {
    user: IUser | null;
  }
}

export default fp(
  async function (fastify) {
    fastify.decorateRequest("user", null);
    fastify.addHook("preHandler", async (request, reply) => {
      let token: string | undefined;
      if (request.cookies?.at) {
        token = request.cookies.at;
      } else {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }
      if (!token) return;

      const payload = fastify.tokenManager.verifyToken("access", token);
      if (payload) {
        const user = await userRepo.findUserById(payload.userId);
        if (!user) return reply.status(401).send(INVALID_USER_TOKEN);
        return request.user = user;
      }

      const refreshToken = request.cookies?.rt;
      if (!refreshToken) return;

      const refreshPayload = fastify.tokenManager.verifyToken("refresh", refreshToken);
      if (refreshPayload) {
        const user = await userRepo.findUserByRefreshToken(refreshToken);
        if (!user || user.id !== refreshPayload.userId) {
          return reply.status(401).send(INVALID_OR_EXPIRED_REFRESH_TOKEN);
        }
        await userRepo.clearRefreshToken(user.id);

        const tokens = await fastify.tokenManager.createTokens({
          userId: user.id,
          email: user.email,
        });
        reply
          .setCookie("at", tokens.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: ACCESS_TOKEN_MAX_AGE,
          })
          .setCookie("rt", tokens.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_TOKEN_MAX_AGE,
          });

        request.user = user;
      }
    });
  },
  { name: "auth" },
);
