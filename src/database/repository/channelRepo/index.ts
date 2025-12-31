import { ChannelModel, ChannelType, type Channel, type ChannelDoc } from "src/database/models/channelModel";
import { toApiResponse, toApiResponseArray } from "src/database/utils";
import { GuildTextChannelModel } from "src/database/models/channelModel/guildTextChannel";
import { DMChannelModel } from "src/database/models/channelModel/dmChannel";
import { VoiceChannelModel } from "src/database/models/channelModel/voiceChannel";
import { GroupDMChannelModel } from "src/database/models/channelModel/groupDmChannel";
import { CategoryChannelModel } from "src/database/models/channelModel/categoryChannel";
import type { QueryFilter } from "mongoose";

export const channelTypeToModel: Record<ChannelType, typeof ChannelModel> = {
  [ChannelType.GuildText]: GuildTextChannelModel,
  [ChannelType.DM]: DMChannelModel,
  [ChannelType.GuildVoice]: VoiceChannelModel,
  [ChannelType.GroupDM]: GroupDMChannelModel,
  [ChannelType.GuildCategory]: CategoryChannelModel,
};

export async function existsChannel(id: string, ...types: ChannelType[]): Promise<boolean> {
  const query: QueryFilter<ChannelDoc> = { _id: id };
  if (types && types.length > 0) {
    query.type = { $in: types };
  }
  const exists = await ChannelModel.exists(query);
  return exists !== null;
}

export async function findChannelById(id: string): Promise<Channel | null> {
  const doc = await ChannelModel.findById(id).lean<ChannelDoc>();
  return toApiResponse(doc);
}

export async function findAllChannels(): Promise<Channel[]> {
  const docs = await ChannelModel.find().sort({ createdAt: 1 }).lean<ChannelDoc[]>();
  return toApiResponseArray(docs);
}

export async function createChannel<T extends ChannelType>(data: { type: T; id: string }): Promise<Channel> {
  const doc = await new channelTypeToModel[data.type]({
    ...data,
    createdAt: new Date(),
  }).save();
  return toApiResponse(doc);
}

export async function updateChannel(id: string, update: Partial<Channel>): Promise<Channel | null> {
  const doc = await ChannelModel.findByIdAndUpdate(
    id,
    { ...update, updatedAt: new Date() },
    { new: true },
  ).lean<ChannelDoc>();
  return toApiResponse(doc);
}

export function deleteChannel(id: string): Promise<boolean> {
  return ChannelModel.deleteOne({ _id: id }).then((result) => result.deletedCount > 0);
}
