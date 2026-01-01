import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface CategoryChannel extends BaseChannel {
  type: ChannelType.GuildCategory;
  name: string;
  position: number;
}
export interface CategoryChannelDoc extends Omit<CategoryChannel, "id"> {
  _id: string;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  position: { type: Number, required: true },
});

export const CategoryChannelModel = ChannelModel.discriminator<CategoryChannelDoc>(
  ChannelType.GuildCategory,
  CategorySchema,
);
