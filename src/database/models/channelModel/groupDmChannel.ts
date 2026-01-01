import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface GroupDMChannel extends BaseChannel {
  type: ChannelType.GroupDM;
  name: string;
}

export interface GroupDMChannelDoc extends Omit<GroupDMChannel, "id"> {
  _id: string;
}

const GroupDMChannelSchema: Schema = new Schema({
  name: { type: String, required: true },
});

export const GroupDMChannelModel = ChannelModel.discriminator<GroupDMChannelDoc>(
  ChannelType.GroupDM,
  GroupDMChannelSchema,
);
