import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface VoiceChannel extends BaseChannel {
  type: ChannelType.GuildVoice;
  bitrate: number;
  topic?: string;
  parentId?: string;
  position: number;
}
export interface VoiceChannelDoc extends Omit<VoiceChannel, "id"> {
  _id: string;
}

const VoiceChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  parent: { type: String, optional: true },
  position: { type: Number, required: true },
  bitrate: { type: Number, default: 64000 },
});

export const VoiceChannelModel = ChannelModel.discriminator<VoiceChannelDoc>(
  ChannelType.GuildVoice,
  VoiceChannelSchema,
);
