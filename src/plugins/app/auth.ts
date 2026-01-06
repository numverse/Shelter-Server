import fp from "fastify-plugin";

import * as userRepo from "src/database/redis/userRepo";

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { XDeviceIdHeader } from "src/common/schemas/types";
import { AppError } from "src/common/errors";

import {
  COOKIE_OPTIONS,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from "src/config";

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
      if (!exists) throw new AppError("INVALID_USER_TOKEN");
      return void (request.userId = payload.userId);
    }
  }

  const refreshToken = request.cookies?.rt;
  if (!refreshToken) throw new AppError("NO_REFRESH_TOKEN");

  const refreshPayload = fastify.tokenManager.verifyToken("refresh", refreshToken);
  if (refreshPayload) {
    try {
      const userRefreshToken = await userRepo.getRefreshToken(refreshPayload.userId, deviceId);
      if (userRefreshToken !== refreshToken) {
        throw new AppError("INVALID_OR_EXPIRED_REFRESH_TOKEN");
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
      throw new AppError("DB_OPERATION_FAILED");
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
      if (!routeOptions.schema || routeOptions.websocket) return;

      const security = routeOptions.schema.security;
      if (!security || security?.length) {
        routeOptions.preHandler = async (request, reply) => {
          await authenticate(fastify, request, reply).catch((err) => {
            throw err;
          });
        };
        routeOptions.schema.headers = XDeviceIdHeader;
      }
    });
  },
  { name: "auth" },
);
