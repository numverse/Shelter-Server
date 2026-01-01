import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface TextChannel extends BaseChannel {
  type: ChannelType.GuildText;
  topic?: string;
  name: string;
  position: number;
  parentId?: string;
}

export interface TextChannelDoc extends Omit<TextChannel, "id"> {
  _id: string;
}

const TextChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  name: { type: String, required: true },
  position: { type: Number, required: true },
  parentId: { type: String, optional: true },
});

export const TextChannelModel = ChannelModel.discriminator<TextChannelDoc>(
  ChannelType.GuildText,
  TextChannelSchema,
);
