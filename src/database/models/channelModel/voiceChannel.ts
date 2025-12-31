import { Schema } from "mongoose";
import { ChannelModel, ChannelType } from ".";

export interface VoiceChannel {
  id: string;
  type: ChannelType.GuildVoice;
  name: string;
  bitrate: number;
  topic?: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
}
export interface VoiceChannelDoc extends Omit<VoiceChannel, "id"> {
  _id: string;
}

const VoiceChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  parent: { type: String, optional: true },
  bitrate: { type: Number, default: 64000 },
});

export const VoiceChannelModel = ChannelModel.discriminator<VoiceChannelDoc>(
  ChannelType.GuildVoice,
  VoiceChannelSchema,
);
