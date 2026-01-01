import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface DMChannel extends BaseChannel {
  type: ChannelType.DM;
}

export interface DMChannelDoc extends Omit<DMChannel, "id"> {
  _id: string;
}

const DMChannelSchema: Schema = new Schema({
});

export const DMChannelModel = ChannelModel.discriminator<DMChannelDoc>(
  ChannelType.DM,
  DMChannelSchema,
);
