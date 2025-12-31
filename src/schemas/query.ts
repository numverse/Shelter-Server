import { Type } from "@fastify/type-provider-typebox";
import * as parts from "./types";
import { ChannelType } from "src/database/models/channelModel";

export const CreateTextChannelQuery = Type.Object({
  type: Type.Enum(ChannelType, {
    const: ChannelType.GuildText,
  }),
  name: parts.channelNameType,
  topic: Type.Optional(parts.channelTopicType),
  parentId: Type.Optional(parts.snowflakeType),
});
export const CreateVoiceChannelQuery = Type.Object({
  type: Type.Enum(ChannelType, {
    const: ChannelType.GuildVoice,
  }),
  name: parts.channelNameType,
  bitrate: Type.Optional(Type.Number({ minimum: 8000, maximum: 96000 })),
  parentId: Type.Optional(parts.snowflakeType),
});
export const CreateCategoryChannelQuery = Type.Object({
  type: Type.Enum(ChannelType, {
    const: ChannelType.GuildCategory,
  }),
  name: parts.channelNameType,
});

export const CreateChannelQuery = Type.Union([
  CreateTextChannelQuery,
  CreateVoiceChannelQuery,
  CreateCategoryChannelQuery,
]);
