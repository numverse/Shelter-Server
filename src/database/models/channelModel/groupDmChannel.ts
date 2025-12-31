import { Schema } from "mongoose";
import { ChannelModel, ChannelType } from ".";

export interface GroupDMChannel {
  id: string;
  type: ChannelType.GroupDM;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface GroupDMChannelDoc extends Omit<GroupDMChannel, "id"> {
  _id: string;
}

const GroupDMChannelSchema: Schema = new Schema({
  topic: { type: String, optional: true },
  parent: { type: String, optional: true },
});

export const GroupDMChannelModel = ChannelModel.discriminator<GroupDMChannelDoc>(
  ChannelType.GroupDM,
  GroupDMChannelSchema,
);
