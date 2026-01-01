import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface GuildTextChannel extends BaseChannel {
  type: ChannelType.GuildText;
  topic?: string;
  position: number;
  parentId?: string;
}

export interface GuildTextChannelDoc extends Omit<GuildTextChannel, "id"> {
  _id: string;
}

const GuildTextChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  parent: { type: String, optional: true },
  position: { type: Number, required: true },
});

export const GuildTextChannelModel = ChannelModel.discriminator<GuildTextChannelDoc>(
  ChannelType.GuildText,
  GuildTextChannelSchema,
);
