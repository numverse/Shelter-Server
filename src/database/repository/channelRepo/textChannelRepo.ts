import { UpdateQuery, QueryFilter } from "mongoose";
import { ChannelDoc, ChannelModel } from "src/database/models/channelModel";
import { type GuildTextChannel, type GuildTextChannelDoc, GuildTextChannelModel } from "src/database/models/channelModel/guildTextChannel";
import { toApiResponse } from "src/database/utils";

export async function createTextChannel(data: {
  name: string;
  topic?: number;
  parentId?: string;
}): Promise<GuildTextChannel> {
  const query: QueryFilter<ChannelDoc> = data.parentId
    ? { parentId: data.parentId }
    : { parentId: { $exists: false } };
  const count = await ChannelModel.countDocuments(query);
  const doc = await new GuildTextChannelModel({
    ...data,
    position: count,
    createdAt: new Date(),
  }).save();
  return toApiResponse<GuildTextChannel>(doc);
}

export async function updateGuildTextChannel(id: string, patch: Partial<Omit<GuildTextChannel,
  "id" | "updatedAt" | "createdAt">>): Promise<GuildTextChannel | null> {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};

  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined) $unset[k] = "";
    else $set[k] = v;
  }

  const update: Record<string, UpdateQuery<GuildTextChannel>> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  const doc = await GuildTextChannelModel.findByIdAndUpdate(
    id,
    update,
    { new: true },
  ).lean<GuildTextChannelDoc>();
  return toApiResponse<GuildTextChannel>(doc);
}
