// Server configuration
// Set these environment variables or modify defaults for your environment

// Server
export const PROTOCOL = process.env.PROTOCOL || "http";
export const DOMAIN = process.env.DOMAIN || "localhost:3000";

export const PORT = parseInt(process.env.PORT || "3000", 10);
export const NODE_ENV = process.env.NODE_ENV || "development";
export const RATE_LIMIT_MAX = parseInt(
  process.env.RATE_LIMIT_MAX || "100",
  10,
);

// MongoDB
export const MONGODB_URI
  = process.env.MONGODB_URI || "mongodb://localhost:27017";
export const DB_NAME = process.env.DB_NAME || "shelter";

// Node mailer (SMTP)
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;

// JWT
export const JWT_SECRET
  = process.env.JWT_SECRET || "shelter-secret-key-change-in-production";
export const ACCESS_TOKEN_EXPIRES_IN = "5m";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";

// Cookie settings
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // NODE_ENV === "production",
  sameSite: "none" as const,
  path: "/",
};
export const ACCESS_TOKEN_MAX_AGE = 5 * 60; // 5 minutes in seconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

// File uploads
export const MAX_FILE_SIZE = parseInt(
  process.env.MAX_FILE_SIZE || String(256 * 1024),
  10,
); // 256KB
export const MAX_FILES = parseInt(process.env.MAX_FILES || "50", 10);

// WebSocket
export const WS_MAX_PAYLOAD = parseInt(
  process.env.WS_MAX_PAYLOAD || String(1048576),
  10,
); // 1MB
export const WS_PING_INTERVAL = parseInt(
  process.env.WS_PING_INTERVAL || "30000",
  10,
); // 30 seconds

// Validate required config in production
if (NODE_ENV === "production") {
  if (JWT_SECRET === "shelter-secret-key-change-in-production") {
    console.warn(
      "WARNING: Using default JWT secret in production. Set JWT_SECRET environment variable.",
    );
  }

  if (MONGODB_URI === "mongodb://localhost:27017") {
    console.warn(
      "WARNING: Using localhost MongoDB in production. Set MONGODB_URI environment variable.",
    );
  }
}

if (process.env.SMTP_HOST === undefined
  || process.env.SMTP_PORT === undefined
  || process.env.SMTP_USER === undefined
  || process.env.SMTP_PASS === undefined) {
  console.warn(
    "WARNING: SMTP configuration is incomplete. Email functionalities may not work properly.",
  );
}
