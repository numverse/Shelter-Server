import { Schema } from "mongoose";
import { ChannelModel, ChannelType } from ".";

export interface CategoryChannel {
  id: string;
  type: ChannelType.GuildCategory;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
  childIds: string[];
}
export interface CategoryChannelDoc extends Omit<CategoryChannel, "id"> {
  _id: string;
}

const CategorySchema: Schema = new Schema({
  childIds: { type: [String], default: [] },
});

export const CategoryChannelModel = ChannelModel.discriminator<CategoryChannelDoc>(
  ChannelType.GuildCategory,
  CategorySchema,
);
