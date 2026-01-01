import { redis } from "bun";
import { REFRESH_TOKEN_MAX_AGE } from "src/config";

const hasher = new Bun.CryptoHasher("sha256");

export async function setRefreshToken(userId: string, deviceId: string, payload: {
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  timestamp?: Date;
}): Promise<number> {
  const hid = hasher.update(deviceId).digest("hex");
  return await redis.hsetex(`rt:${userId}`, "EX", REFRESH_TOKEN_MAX_AGE, "FIELDS", 4,
    hid, payload.refreshToken,
    `${hid};ua`, payload.userAgent,
    `${hid};ip`, payload.ipAddress,
    `${hid};ts`, (payload.timestamp ?? new Date()).toISOString(),
  );
}

export async function clearRefreshToken(userId: string, deviceId: string): Promise<number> {
  const hid = hasher.update(deviceId).digest("hex");
  return await redis.hdel(`rt:${userId}`, hid);
}

export async function getRefreshToken(userId: string, deviceId: string): Promise<string | null> {
  const hid = hasher.update(deviceId).digest("hex");
  return await redis.hget(`rt:${userId}`, hid);
}

export async function existsRefreshToken(userId: string, deviceId: string): Promise<boolean> {
  const hid = hasher.update(deviceId).digest("hex");
  return await redis.hexists(`rt:${userId}`, hid);
}

interface RefreshTokenInfo {
  hashedDeviceId: string;
  userAgent: string;
  ipAddress: string;
  lastUsedTime: string;
}
export async function getAllDevices(userId: string): Promise<RefreshTokenInfo[]> {
  const entries = await redis.hgetall(`rt:${userId}`);
  const devices: RefreshTokenInfo[] = [];
  for (const [key] of Object.entries(entries)) {
    if (!key.includes(";")) {
      devices.push({
        hashedDeviceId: key,
        userAgent: entries[`${key};ua`] || "",
        ipAddress: entries[`${key};ip`] || "",
        lastUsedTime: entries[`${key};ts`] || "0",
      });
    }
  }
  return devices;
}
