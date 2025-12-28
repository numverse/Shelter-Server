import { redis } from "bun";
import { REFRESH_TOKEN_MAX_AGE } from "src/config";

export async function setRefreshToken(userId: string, deviceId: string, payload: {
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  timestamp?: Date;
}): Promise<number> {
  return await redis.hsetex(`rt:${userId}`, "EX", REFRESH_TOKEN_MAX_AGE, "FIELDS", 4,
    deviceId, payload.refreshToken,
    `${deviceId};ua`, payload.userAgent,
    `${deviceId};ip`, payload.ipAddress,
    `${deviceId};ts`, (payload.timestamp ?? new Date()).toISOString(),
  );
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
