import { Schema } from "mongoose";
import { ChannelModel, ChannelType } from ".";

export interface DMChannel {
  id: string;
  type: ChannelType.DM;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DMChannelDoc extends Omit<DMChannel, "id"> {
  _id: string;
}

const DMChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  parent: { type: String, optional: true },
});

export const DMChannelModel = ChannelModel.discriminator<DMChannelDoc>(
  ChannelType.DM,
  DMChannelSchema,
);
