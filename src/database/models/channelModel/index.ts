import mongoose, { Schema } from "mongoose";
import { GuildTextChannel } from "./guildTextChannel";
import { VoiceChannel } from "./voiceChannel";
import { CategoryChannel } from "./categoryChannel";
import { DMChannel } from "./dmChannel";
import { GroupDMChannel } from "./groupDmChannel";

export type Channel = GuildTextChannel
  | DMChannel
  | VoiceChannel
  | GroupDMChannel
  | CategoryChannel;

export interface ChannelDoc extends Omit<Channel, "id"> {
  _id: string;
}

export enum ChannelType {
  GuildText = 0,
  DM = 1,
  GuildVoice = 2,
  GroupDM = 3,
  GuildCategory = 4,
}

const BaseChannelSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    type: { type: Number, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, optional: true },
  },
  {
    _id: false,
    timestamps: false,
    discriminatorKey: "type",
  },
);

// Indexes
BaseChannelSchema.index({ name: 1 });

export const ChannelModel = mongoose.model<ChannelDoc>("Channel", BaseChannelSchema);
