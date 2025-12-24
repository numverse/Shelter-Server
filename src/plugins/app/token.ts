import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { JWT_SECRET, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../config";
import * as userRepo from "src/database/repository/userRepo";

const typeExpirations: Record<JWTPayload["type"], jwt.SignOptions["expiresIn"]> = {
  access: ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  refresh: REFRESH_TOKEN_EXPIRES_IN,
  email: "10m",
};

interface JWTPayload {
  type: "access" | "refresh" | "email";
  userId: string;
  email: string;
}

type JWTCreatePayload = Omit<JWTPayload, "type">;

declare module "fastify" {
  export interface FastifyInstance {
    tokenManager: typeof tokenManager;
  }
}

const tokenManager = {
  createTokens,
  generateToken,
  verifyToken,
};

function generateToken(type: JWTPayload["type"], payload: JWTCreatePayload): string {
  return jwt.sign({ ...payload, type: type }, JWT_SECRET, { expiresIn: typeExpirations[type] });
}

function verifyToken(type: JWTPayload["type"], token: string): { userId: string; email?: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (payload.type !== type) return null;
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

async function createTokens(payload: JWTCreatePayload): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateToken("access", payload);
  const refreshToken = generateToken("refresh", payload);

  // Save refresh token to database (JWT handles expiration)
  await userRepo.saveRefreshToken(payload.userId, refreshToken);

  return { accessToken, refreshToken };
}

export default fp(
  async function (fastify) {
    fastify.decorate("tokenManager", tokenManager);
  },
  // You should name your plugins if you want to avoid name collisions
  // and/or to perform dependency checks.
  { name: "token" },
);
