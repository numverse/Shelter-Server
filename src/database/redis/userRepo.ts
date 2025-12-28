import { redis } from "bun";
import { REFRESH_TOKEN_MAX_AGE } from "src/config";

export async function setRefreshToken(userId: string, deviceId: string, refreshToken: string): Promise<number> {
  return await redis.hsetex(`rt:${userId}`, "EX", REFRESH_TOKEN_MAX_AGE, "FIELDS", 1, deviceId, refreshToken);
}

export async function clearRefreshToken(userId: string, deviceId: string): Promise<number> {
  return await redis.hdel(`rt:${userId}`, deviceId);
}

export async function getRefreshToken(userId: string, deviceId: string): Promise<string | null> {
  return await redis.hget(`rt:${userId}`, deviceId);
}

export async function existsRefreshToken(userId: string, deviceId: string): Promise<boolean> {
  return await redis.hexists(`rt:${userId}`, deviceId);
}
