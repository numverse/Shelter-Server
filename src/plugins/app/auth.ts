import fp from "fastify-plugin";
import { IUser } from "src/database/models/userModel";
import * as userRepo from "src/database/repository/userRepo";
import { COOKIE_OPTIONS, ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "../../config";
import { DB_OPERATION_FAILED, INVALID_OR_EXPIRED_REFRESH_TOKEN, INVALID_USER_TOKEN, NO_REFRESH_TOKEN } from "src/schemas/errors";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  export interface FastifyRequest {
    user: IUser | null;
  }
  export interface FastifyReply {
    setTokenCookies: (accessToken: string, refreshToken: string) => FastifyReply;
  }
}

function setTokenCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  return reply
    .setCookie("at", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })
    .setCookie("rt", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
}

async function authenticate(fastify: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  let token: string | undefined;
  if (request.cookies?.at) {
    token = request.cookies.at;
  } else {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    const payload = fastify.tokenManager.verifyToken("access", token);
    if (payload) {
      const user = await userRepo.findUserById(payload.userId);
      if (!user) return reply.status(401).send(INVALID_USER_TOKEN);
      return request.user = user;
    }
  }

  const refreshToken = request.cookies?.rt;
  if (!refreshToken) return reply.status(401).send(NO_REFRESH_TOKEN);

  const refreshPayload = fastify.tokenManager.verifyToken("refresh", refreshToken);
  if (refreshPayload) {
    let user: IUser | null;
    try {
      user = await userRepo.findUserById(refreshPayload.userId);
      if (!user) return console.log("no user");
      if (!user || user.refreshToken !== refreshToken) {
        return reply.status(401).send(INVALID_OR_EXPIRED_REFRESH_TOKEN);
      }
      await userRepo.clearRefreshToken(user.id);

      const tokens = await fastify.tokenManager.createTokens({
        userId: user.id,
        email: user.email,
      });
      reply.setTokenCookies(tokens.accessToken, tokens.refreshToken);
    } catch {
      return reply.status(500).send(DB_OPERATION_FAILED);
    }

    request.user = user;
  }
}

export default fp(
  async function (fastify) {
    fastify.decorateRequest("user", null);
    fastify.decorateReply("setTokenCookies", function (this: FastifyReply, accessToken: string, refreshToken: string) {
      return setTokenCookies(this, accessToken, refreshToken);
    });
    fastify.addHook("onRoute", (routeOptions) => {
      const security = routeOptions.schema?.security;
      if (!security || security?.length) {
        routeOptions.preHandler = async (request, reply, done) => {
          await authenticate(fastify, request, reply);
          done();
        };
      }
    });
  },
  { name: "auth" },
);
