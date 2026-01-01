import { Schema } from "mongoose";
import { BaseChannel, ChannelModel, ChannelType } from ".";

export interface GroupDMChannel extends BaseChannel {
  type: ChannelType.GroupDM;
}

export interface GroupDMChannelDoc extends Omit<GroupDMChannel, "id"> {
  _id: string;
}

const GroupDMChannelSchema: Schema = new Schema({
});

export const GroupDMChannelModel = ChannelModel.discriminator<GroupDMChannelDoc>(
  ChannelType.GroupDM,
  GroupDMChannelSchema,
);
