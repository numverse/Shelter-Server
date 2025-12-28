import { redis } from "bun";
import { REFRESH_TOKEN_MAX_AGE } from "src/config";

export async function setRefreshToken(userId: string, deviceId: string, refreshToken: string): Promise<number> {
  await redis.set(`refreshToken:${userId}:${deviceId}`, refreshToken);
  return await redis.expire(`refreshToken:${userId}:${deviceId}`, REFRESH_TOKEN_MAX_AGE);
}

export async function clearRefreshToken(userId: string, deviceId: string): Promise<number> {
  return await redis.del(`refreshToken:${userId}:${deviceId}`);
}

export async function getRefreshToken(userId: string, deviceId: string): Promise<string | null> {
  return await redis.get(`refreshToken:${userId}:${deviceId}`);
}

export async function existsRefreshToken(userId: string, deviceId: string): Promise<boolean> {
  return await redis.exists(`refreshToken:${userId}:${deviceId}`);
}
