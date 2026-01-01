import mongoose, { Schema } from "mongoose";
import { TextChannel } from "./textChannel";
import { VoiceChannel } from "./voiceChannel";
import { CategoryChannel } from "./categoryChannel";
import { DMChannel } from "./dmChannel";
import { GroupDMChannel } from "./groupDmChannel";

export interface BaseChannel {
  id: string;
  type: ChannelType;
  createdAt: Date;
  updatedAt?: Date;
}

export type Channel = TextChannel
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
    _id: { type: String, required: true, alias: "id" },
    type: { type: Number, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, optional: true },

    position: { type: Number, optional: true },
    parentId: { type: String, optional: true },
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
