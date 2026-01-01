import { UpdateQuery, QueryFilter } from "mongoose";
import { ChannelDoc, ChannelModel } from "src/database/models/channelModel";
import { type TextChannel, type TextChannelDoc, TextChannelModel } from "src/database/models/channelModel/textChannel";
import { toApiResponse } from "src/database/utils";

export async function createTextChannel(data: {
  name: string;
  topic?: number;
  parentId?: string;
}): Promise<TextChannel> {
  const query: QueryFilter<ChannelDoc> = data.parentId
    ? { parentId: data.parentId }
    : { parentId: { $exists: false } };
  const count = await ChannelModel.countDocuments(query);
  const doc = await new TextChannelModel({
    ...data,
    position: count,
    createdAt: new Date(),
  }).save();
  return toApiResponse<TextChannel>(doc);
}

export async function updateGuildTextChannel(id: string, patch: Partial<Omit<TextChannel,
  "id" | "updatedAt" | "createdAt">>): Promise<TextChannel | null> {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};

  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined) $unset[k] = "";
    else $set[k] = v;
  }

  const update: Record<string, UpdateQuery<TextChannel>> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  const doc = await TextChannelModel.findByIdAndUpdate(
    id,
    update,
    { new: true },
  ).lean<TextChannelDoc>();
  return toApiResponse<TextChannel>(doc);
}
