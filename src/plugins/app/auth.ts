import fp from "fastify-plugin";
import * as userRepo from "../../database/redis/userRepo";
import { COOKIE_OPTIONS, ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "../../config";
import { DB_OPERATION_FAILED, INVALID_OR_EXPIRED_REFRESH_TOKEN, INVALID_USER_TOKEN, NO_REFRESH_TOKEN } from "src/schemas/errors";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  export interface FastifyRequest {
    userId: string | null;
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

  const deviceId = request.headers["x-device-id"] as string;

  if (token) {
    const payload = fastify.tokenManager.verifyToken("access", token);
    if (payload) {
      const exists = await userRepo.existsRefreshToken(payload.userId, deviceId);
      if (!exists) return reply.status(401).send(INVALID_USER_TOKEN);
      return void (request.userId = payload.userId);
    }
  }

  const refreshToken = request.cookies?.rt;
  if (!refreshToken) return reply.status(401).send(NO_REFRESH_TOKEN);

  const refreshPayload = fastify.tokenManager.verifyToken("refresh", refreshToken);
  if (refreshPayload) {
    try {
      const userRefreshToken = await userRepo.getRefreshToken(refreshPayload.userId, deviceId);
      if (userRefreshToken !== refreshToken) {
        return reply.status(401).send(INVALID_OR_EXPIRED_REFRESH_TOKEN);
      }

      const tokens = await fastify.tokenManager.createTokens({
        deviceId: deviceId,
        userAgent: request.headers["user-agent"] || "unknown",
        ipAddress: request.ip,
        userId: refreshPayload.userId,
        email: refreshPayload.email,
      });
      reply.setTokenCookies(tokens.accessToken, tokens.refreshToken);
    } catch {
      return reply.status(500).send(DB_OPERATION_FAILED);
    }
    return void (request.userId = refreshPayload.userId);
  }
}

export default fp(
  async function (fastify) {
    fastify.decorateRequest("userId", null);
    fastify.decorateReply("setTokenCookies", function (this: FastifyReply, accessToken: string, refreshToken: string) {
      return setTokenCookies(this, accessToken, refreshToken);
    });
    fastify.addHook("onRoute", (routeOptions) => {
      const security = routeOptions.schema?.security;
      if (routeOptions.websocket) return;
      if (!security || security?.length) {
        routeOptions.preHandler = async (request, reply) => {
          await authenticate(fastify, request, reply);
        };
      }
    });
  },
  { name: "auth" },
);
