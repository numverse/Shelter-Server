import { ChannelModel, type IChannel, type IChannelDoc } from "../models/channelModel";
import { toApiResponse, toApiResponseArray } from "../utils";

export async function findChannelById(id: string): Promise<IChannel | null> {
  const doc = await ChannelModel.findById(id).lean<IChannelDoc>();
  return toApiResponse(doc);
}

export async function findAllChannels(): Promise<IChannel[]> {
  const docs = await ChannelModel.find().sort({ createdAt: 1 }).lean<IChannelDoc[]>();
  return toApiResponseArray(docs);
}

export async function createChannel(data: { id: string; name: string; description?: string }): Promise<IChannel> {
  const doc = await ChannelModel.create({
    _id: data.id,
    name: data.name,
    description: data.description || "",
  });
  return toApiResponse(doc) as IChannel;
}

export async function updateChannel(id: string, data: { name?: string; description?: string }): Promise<IChannel | null> {
  const doc = await ChannelModel.findByIdAndUpdate(
    id,
    { $set: {
      ...data,
      updatedAt: new Date(),
    } },
    { new: true },
  ).lean<IChannelDoc>();
  return toApiResponse(doc);
}

export function deleteChannel(id: string): Promise<boolean> {
  return ChannelModel.deleteOne({ _id: id }).then((result) => result.deletedCount > 0);
}

export default {
  findChannelById,
  findAllChannels,
  createChannel,
  updateChannel,
  deleteChannel,
};
