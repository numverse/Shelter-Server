import { Schema } from "mongoose";
import { ChannelModel, ChannelType } from ".";

export interface GuildTextChannel {
  id: string;
  type: ChannelType.GuildText;
  name: string;
  topic?: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string;
}

export interface GuildTextChannelDoc extends Omit<GuildTextChannel, "id"> {
  _id: string;
}

const GuildTextChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  parent: { type: String, optional: true },
});

export const GuildTextChannelModel = ChannelModel.discriminator<GuildTextChannelDoc>(
  ChannelType.GuildText,
  GuildTextChannelSchema,
);
