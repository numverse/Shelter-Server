import { Type } from "@fastify/type-provider-typebox";

export const snowflakeType = Type.String({
  pattern: "^[0-9]{1,20}$",
  description: "A unique snowflake identifier",
});

export const displayNameType = Type.String({
  minLength: 2,
  maxLength: 64,
  description: "A display name between 2 and 64 characters",
});

export const userFlagsType = Type.Number({
  description: "Bitfield representing user flags\n0 = None\n1 = BetaTester\n2 = Member\n4 = Moderator\n8 = Admin",
});

export const emailType = Type.String({
  format: "email",
  description: "A valid email address",
});

export const passwordType = Type.String({
  minLength: 6,
  maxLength: 64,
  description: "A secure password",
});

export const usernameType = Type.String({
  minLength: 2,
  maxLength: 32,
  description: "A username between 2 and 32 characters, containing only letters, numbers, underscores, and periods",
  pattern: "^[A-Za-z0-9_.]+$",
});

export const dateStringType = Type.String({
  format: "date-time",
  description: "An ISO 8601 date-time string",
});

export const channelNameType = Type.String({
  minLength: 1,
  maxLength: 32,
  description: "The name of the channel",
});

export const channelTopicType = Type.String({
  minLength: 0,
  maxLength: 256,
  description: "The topic of the channel",
});

export const channelBitrateType = Type.Number({
  minimum: 8000,
  maximum: 96000,
  description: "The bitrate of the voice channel in bits per second",
});

export const emojiPackNameType = Type.String({
  minLength: 1,
  maxLength: 32,
  description: "The name of the emoji pack",
});

export const emojiNameType = Type.String({
  minLength: 2,
  maxLength: 32,
  pattern: "^[a-zA-Z0-9_-]+$",
  description: "The name of the emoji",
});

export const emojiType = Type.Object({
  id: snowflakeType,
  name: emojiNameType,
});

export const fileType = Type.Any({
  description: "FormData file upload object",
});

export const messageContentType = Type.String({
  minLength: 1,
  maxLength: 2000,
  description: "The content of the message",
});

export const XDeviceIdHeader = Type.Object({
  "x-device-id": Type.String({
    pattern: "^[^;]+$",
    description: "Unique device identifier",
  }),
});
