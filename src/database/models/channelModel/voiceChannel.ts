import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface VoiceChannel extends BaseChannel {
  type: ChannelType.GuildVoice;
  bitrate: number;
  topic?: string;
  name: string;
  position: number;
  parentId?: string;
}
export interface VoiceChannelDoc extends Omit<VoiceChannel, "id"> {
  _id: string;
}

const VoiceChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  bitrate: { type: Number, default: 64000 },
  name: { type: String, required: true },
  position: { type: Number, required: true },
  parentId: { type: String, optional: true },
});

export const VoiceChannelModel = ChannelModel.discriminator<VoiceChannelDoc>(
  ChannelType.GuildVoice,
  VoiceChannelSchema,
);
