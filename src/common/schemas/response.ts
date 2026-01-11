import { Type } from "@fastify/type-provider-typebox";
import * as parts from "./types";
import { ChannelType } from "src/database/models/channelModel";

export const TextChannel = Type.Object({
  id: parts.snowflakeType,
  type: Type.Enum(ChannelType, { const: ChannelType.GuildText }),
  name: parts.channelNameType,
  parentId: Type.Optional(parts.snowflakeType),
  position: parts.channelPositionType,
  topic: Type.Optional(parts.channelTopicType),
  createdAt: parts.dateStringType,
  updatedAt: Type.Optional(parts.dateStringType),
});
export const VoiceChannel = Type.Object({
  id: parts.snowflakeType,
  type: Type.Enum(ChannelType, { const: ChannelType.GuildVoice }),
  name: parts.channelNameType,
  parentId: Type.Optional(parts.snowflakeType),
  position: parts.channelPositionType,
  topic: Type.Optional(parts.channelTopicType),
  bitrate: parts.channelBitrateType,
  createdAt: parts.dateStringType,
  updatedAt: Type.Optional(parts.dateStringType),
});
export const CategoryChannel = Type.Object({
  id: parts.snowflakeType,
  type: Type.Enum(ChannelType, { const: ChannelType.GuildCategory }),
  name: parts.channelNameType,
  position: parts.channelPositionType,
  createdAt: parts.dateStringType,
  updatedAt: Type.Optional(parts.dateStringType),
});
export const DMChannel = Type.Object({
  id: parts.snowflakeType,
  type: Type.Enum(ChannelType, { const: ChannelType.DM }),
  createdAt: parts.dateStringType,
  updatedAt: Type.Optional(parts.dateStringType),
});

export const ChannelResponse = Type.Union([
  TextChannel,
  DMChannel,
  VoiceChannel,
  CategoryChannel,
]);

export const UserBasicResponse = Type.Object({
  id: parts.snowflakeType,
  username: parts.usernameType,
  displayName: Type.Optional(parts.displayNameType),
  flags: parts.userFlagsType,
  avatarId: Type.Optional(parts.snowflakeType),
  createdAt: parts.dateStringType,
  presence: Type.Optional(Type.Object({
    status: Type.Union([
      Type.Literal("online"),
      Type.Literal("offline"),
      Type.Literal("idle"),
      Type.Literal("dnd"),
    ]),
  })),
});

export const UserResponse = Type.Object({
  id: parts.snowflakeType,
  username: parts.usernameType,
  displayName: Type.Optional(parts.displayNameType),
  email: parts.emailType,
  flags: parts.userFlagsType,
  avatarId: Type.Optional(parts.snowflakeType),
  emojiPacks: Type.Optional(Type.Array(parts.snowflakeType)),
  createdAt: parts.dateStringType,
  updatedAt: Type.Optional(parts.dateStringType),
});

export const EmojiResponse = Type.Object({
  id: parts.snowflakeType,
  name: parts.emojiNameType,
});

export const EmojiPackResponse = Type.Object({
  id: parts.snowflakeType,
  name: parts.emojiPackNameType,
  creatorId: parts.snowflakeType,
  createdAt: parts.dateStringType,
  updatedAt: Type.Optional(parts.dateStringType),
  emojis: Type.Array(EmojiResponse),
});

export const FileMetadataResponse = Type.Object({
  id: parts.snowflakeType,
  filename: Type.String(),
  mimeType: Type.String(),
  size: Type.Number(),
  createdAt: parts.dateStringType,
  uploaderId: parts.snowflakeType,
});

export const MessageResponse = Type.Object({
  id: parts.snowflakeType,
  channelId: parts.snowflakeType,
  authorId: parts.snowflakeType,
  content: Type.Optional(Type.String()),
  replyTo: Type.Optional(parts.snowflakeType),
  attachments: Type.Optional(Type.Array(Type.Omit(FileMetadataResponse, ["createdAt", "uploaderId"]))),
  reactions: Type.Optional(Type.Array(
    Type.Object({
      emojiId: Type.Optional(parts.snowflakeType),
      emojiName: parts.emojiNameType,
      userIds: Type.Array(parts.snowflakeType),
    }),
  )),
  createdAt: parts.dateStringType,
  updatedAt: Type.Optional(parts.dateStringType),
});

export const ErrorResponse = Type.Object({
  error: Type.String(),
  code: Type.String(),
  message: Type.String(),
  statusCode: Type.Number(),
});

export const SuccessResponse = Type.Object({
  success: Type.Literal(true),
});
