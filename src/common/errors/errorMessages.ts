const errorMessages = {
  AUTHENTICATION_REQUIRED: {
    code: "AUTHENTICATION_REQUIRED",
    message: "Authentication is required to access this resource.",
    error: "Unauthorized",
    statusCode: 401,
  },
  INVALID_USER_TOKEN: {
    code: "INVALID_USER_TOKEN",
    message: "The user token provided is invalid.",
    error: "Unauthorized",
    statusCode: 401,
  },

  PASSWORD_MISMATCH: {
    code: "PASSWORD_MISMATCH",
    message: "The provided passwords do not match.",
    error: "Bad Request",
    statusCode: 400,
  },
  INVALID_EMAIL_PASSWORD: {
    code: "INVALID_EMAIL_PASSWORD",
    message: "The provided email or password is incorrect.",
    error: "Unauthorized",
    statusCode: 401,
  },
  TOKEN_GENERATION_FAILED: {
    code: "TOKEN_GENERATION_FAILED",
    message: "Failed to generate authentication tokens.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  INVALID_OR_EXPIRED_REFRESH_TOKEN: {
    code: "INVALID_OR_EXPIRED_REFRESH_TOKEN",
    message: "The refresh token is invalid or has expired.",
    error: "Unauthorized",
    statusCode: 401,
  },
  NO_REFRESH_TOKEN: {
    code: "NO_REFRESH_TOKEN",
    message: "No refresh token provided.",
    error: "Bad Request",
    statusCode: 400,
  },
  EMAIL_EXISTS: {
    code: "EMAIL_EXISTS",
    message: "A user with this email already exists.",
    error: "Bad Request",
    statusCode: 400,
  },
  USERNAME_TAKEN: {
    code: "USERNAME_TAKEN",
    message: "This username is already taken.",
    error: "Bad Request",
    statusCode: 400,
  },
  INVALID_OR_EXPIRED_VERIFICATION_TOKEN: {
    code: "INVALID_OR_EXPIRED_VERIFICATION_TOKEN",
    message: "The provided verification token is invalid or has expired.",
    error: "Bad Request",
    statusCode: 400,
  },
  REGISTRATION_FAILED: {
    code: "REGISTRATION_FAILED",
    message: "Failed to register the user.",
    error: "Internal Server Error",
    statusCode: 500,
  },

  // Channel Errors
  CHANNEL_CREATION_FAILED: {
    code: "CHANNEL_CREATION_FAILED",
    message: "Failed to create channel.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  CHANNEL_NOT_FOUND: {
    code: "CHANNEL_NOT_FOUND",
    message: "The requested channel was not found.",
    error: "Not Found",
    statusCode: 404,
  },
  CHANNEL_NOT_EXIST_OR_INACCESSIBLE: {
    code: "CHANNEL_NOT_EXIST_OR_INACCESSIBLE",
    message: "The channel does not exist or is inaccessible.",
    error: "Not Found",
    statusCode: 404,
  },
  CHANNEL_UPDATE_FAILED: {
    code: "CHANNEL_UPDATE_FAILED",
    message: "Failed to update channel.",
    error: "Internal Server Error",
    statusCode: 500,
  },

  // Emoji Errors
  EMOJI_NOT_FOUND: {
    code: "EMOJI_NOT_FOUND",
    message: "The requested emoji was not found.",
    error: "Not Found",
    statusCode: 404,
  },
  EMOJI_PACK_NOT_FOUND: {
    code: "EMOJI_PACK_NOT_FOUND",
    message: "The requested emoji pack was not found.",
    error: "Not Found",
    statusCode: 404,
  },
  EMOJI_PACK_CREATION_FAILED: {
    code: "EMOJI_PACK_CREATION_FAILED",
    message: "Failed to create emoji pack.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  EMOJI_PACK_UPDATE_FAILED: {
    code: "EMOJI_PACK_UPDATE_FAILED",
    message: "Failed to update emoji pack.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  EMOJI_PACK_DELETE_FAILED: {
    code: "EMOJI_PACK_DELETE_FAILED",
    message: "Failed to delete emoji pack.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  EMOJI_PACK_REQUIRES_EMOJI: {
    code: "EMOJI_PACK_REQUIRES_EMOJI",
    message: "An emoji pack must contain at least one emoji.",
    error: "Bad Request",
    statusCode: 400,
  },
  EMOJI_PACK_REQUIRES_EMOJI_NAME: {
    code: "EMOJI_PACK_REQUIRES_EMOJI_NAME",
    message: "Each emoji in the pack must have a valid name.",
    error: "Bad Request",
    statusCode: 400,
  },
  EMOJI_LIMIT_EXCEEDED: {
    code: "EMOJI_LIMIT_EXCEEDED",
    message: "The maximum number of emojis allowed in a pack is 50.",
    error: "Bad Request",
    statusCode: 400,
  },

  // User Errors
  USER_UPDATE_FAILED: {
    code: "USER_UPDATE_FAILED",
    message: "Failed to update user profile.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  AVATAR_NOT_FOUND: {
    code: "AVATAR_NOT_FOUND",
    message: "The requested avatar was not found.",
    error: "Not Found",
    statusCode: 404,
  },
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "The requested user was not found.",
    error: "Not Found",
    statusCode: 404,
  },

  // File Errors
  FILE_NOT_FOUND: {
    code: "FILE_NOT_FOUND",
    message: "The requested file was not found.",
    error: "Not Found",
    statusCode: 404,
  },
  FILE_UPLOAD_FAILED: {
    code: "FILE_UPLOAD_FAILED",
    message: "Failed to upload the file.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  FILE_RETRIEVAL_FAILED: {
    code: "FILE_RETRIEVAL_FAILED",
    message: "Failed to retrieve the file.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  FILE_DELETE_FAILED: {
    code: "FILE_DELETE_FAILED",
    message: "Failed to delete the file.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  FILE_TOO_LARGE: {
    code: "FILE_TOO_LARGE",
    message: "The uploaded file exceeds the maximum allowed size.",
    error: "Bad Request",
    statusCode: 400,
  },
  FILE_MUST_BE_IMAGE: {
    code: "FILE_MUST_BE_IMAGE",
    message: "The uploaded file must be an image.",
    error: "Bad Request",
    statusCode: 400,
  },
  FILE_TYPE_NOT_ALLOWED: {
    code: "FILE_TYPE_NOT_ALLOWED",
    message: "The uploaded file type is not allowed.",
    error: "Bad Request",
    statusCode: 400,
  },

  // message Errors
  MESSAGE_NOT_FOUND: {
    code: "MESSAGE_NOT_FOUND",
    message: "The requested message was not found.",
    error: "Not Found",
    statusCode: 404,
  },
  MESSAGE_CREATION_FAILED: {
    code: "MESSAGE_CREATION_FAILED",
    message: "Failed to create message.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  MESSAGE_DELETE_FAILED: {
    code: "MESSAGE_DELETE_FAILED",
    message: "Failed to delete message.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  MESSAGE_UPDATE_FAILED: {
    code: "MESSAGE_UPDATE_FAILED",
    message: "Failed to update message.",
    error: "Internal Server Error",
    statusCode: 500,
  },

  // CDN Errors
  INVALID_RESOURCE: {
    code: "INVALID_RESOURCE",
    message: "The requested resource is invalid or not found.",
    error: "Not Found",
    statusCode: 404,
  },

  // General Errors
  MISSING_REQUIRED_FIELDS: {
    code: "MISSING_REQUIRED_FIELDS",
    message: "One or more required fields are missing.",
    error: "Bad Request",
    statusCode: 400,
  },
  PERMISSION_DENIED: {
    code: "PERMISSION_DENIED",
    message: "You do not have permission to perform this action.",
    error: "Forbidden",
    statusCode: 403,
  },
  DB_OPERATION_FAILED: {
    code: "DB_OPERATION_FAILED",
    message: "A database operation failed.",
    error: "Internal Server Error",
    statusCode: 500,
  },
  // RATE_LIMIT_EXCEEDED: (sec: number) => ({
  //     code: "RATE_LIMIT_EXCEEDED",
  //     message: `Rate limit exceeded, retry in ${sec} seconds`,
  //     error: "Too Many Requests",
  //     statusCode: 429,
  // }),
};

export { errorMessages };
