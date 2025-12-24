import { Readable } from "stream";
import { EmojiPackModel, getEmojiGridFSBucket, type IEmojiPack, type IEmojiPackDoc, type IEmoji } from "../models/emojiPackModel";
import { toApiResponse, toApiResponseArray } from "../utils";
import { Types } from "mongoose";

export async function existsEmojiPackByName(name: string): Promise<boolean> {
  const count = await EmojiPackModel.countDocuments({ name });
  return count > 0;
}

export async function existsEmojiPackById(id: string): Promise<boolean> {
  const count = await EmojiPackModel.countDocuments({ _id: id });
  return count > 0;
}

export async function findEmojiPackById(id: string): Promise<IEmojiPack | null> {
  const doc = await EmojiPackModel.findById(id).lean<IEmojiPackDoc>();
  return toApiResponse(doc);
}

export async function findAllEmojiPacks(): Promise<IEmojiPack[]> {
  const docs = await EmojiPackModel.find().sort({ createdAt: -1 }).lean<IEmojiPackDoc[]>();
  return toApiResponseArray(docs);
}

export async function findEmojiPacksByCreator(creatorId: string): Promise<IEmojiPack[]> {
  const docs = await EmojiPackModel.find({ creatorId }).lean<IEmojiPackDoc[]>();
  return toApiResponseArray(docs);
}

export async function findEmojiById(emojiId: string): Promise<{ pack: IEmojiPack; emoji: IEmoji } | null> {
  const doc = await EmojiPackModel.findOne({ "emojis.id": emojiId }, { "emojis.$": 1, "name": 1, "creatorId": 1 }).lean<IEmojiPackDoc>();
  if (!doc || !doc.emojis || doc.emojis.length === 0) {
    return null;
  }
  const emoji = doc.emojis[0];
  return {
    pack: toApiResponse(doc) as IEmojiPack,
    emoji,
  };
}

// Upload emoji image to GridFS
export async function uploadEmojiImage(emojiId: string, buffer: Buffer, mimeType: string): Promise<void> {
  const bucket = getEmojiGridFSBucket();

  const uploadStream = bucket.openUploadStreamWithId(
    new Types.ObjectId(emojiId),
    emojiId,
    {
      metadata: {
        contentType: mimeType,
      },
    },
  );

  await new Promise<void>((resolve, reject) => {
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream)
      .on("error", reject)
      .on("finish", resolve);
  });
}

// Get emoji image stream from GridFS
export function getEmojiImageStream(emojiId: string): Readable {
  const bucket = getEmojiGridFSBucket();
  return bucket.openDownloadStream(new Types.ObjectId(emojiId));
}

// Get emoji mimeType from GridFS metadata
export async function getEmojiMimeType(emojiId: string): Promise<string> {
  const bucket = getEmojiGridFSBucket();
  const files = await bucket.find({ _id: new Types.ObjectId(emojiId) }).toArray();
  if (files.length > 0 && files[0].metadata?.contentType) {
    return files[0].metadata.contentType as string;
  }
  return "image/png"; // default
}

// Delete emoji image from GridFS
export async function deleteEmojiImage(emojiId: string): Promise<void> {
  const bucket = getEmojiGridFSBucket();
  try {
    await bucket.delete(new Types.ObjectId(emojiId));
  } catch {
    // Ignore if not found
  }
}

export async function createEmojiPack(data: {
  id: string;
  name: string;
  creatorId: string;
  emojis: { id: string; name: string; mimeType: string; buffer: Buffer }[];
}): Promise<IEmojiPack> {
  // Upload emoji images to GridFS
  for (const emoji of data.emojis) {
    await uploadEmojiImage(emoji.id, emoji.buffer, emoji.mimeType);
  }

  // Save pack metadata (without image data)
  const doc = await EmojiPackModel.create({
    _id: data.id,
    name: data.name,
    creatorId: data.creatorId,
    emojis: data.emojis.map((e) => ({
      id: e.id,
      name: e.name,
    })),
  });
  return toApiResponse(doc) as IEmojiPack;
}

export async function updateEmojiPack(
  id: string,
  data: {
    name?: string;
    emojis?: { id: string; name: string; mimeType?: string; buffer?: Buffer }[];
    deletedEmojiIds?: string[];
  },
): Promise<IEmojiPack | null> {
  const pack = await EmojiPackModel.findById(id).lean<IEmojiPackDoc>();
  if (!pack) return null;

  // Delete removed emoji images from GridFS
  if (data.deletedEmojiIds) {
    for (const emojiId of data.deletedEmojiIds) {
      await deleteEmojiImage(emojiId);
    }
  }

  // Upload new emoji images to GridFS
  if (data.emojis) {
    for (const emoji of data.emojis) {
      if (emoji.buffer && emoji.mimeType) {
        await uploadEmojiImage(emoji.id, emoji.buffer, emoji.mimeType);
      }
    }
  }

  const updateData: Partial<IEmojiPack> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.emojis !== undefined) {
    updateData.emojis = data.emojis.map((e) => ({
      id: e.id,
      name: e.name,
    }));
  }

  const doc = await EmojiPackModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true },
  ).lean<IEmojiPackDoc>();
  return toApiResponse(doc);
}

export async function deleteEmojiPack(id: string): Promise<boolean> {
  // Get pack to delete emoji images from GridFS
  const doc = await EmojiPackModel.findById(id).lean<IEmojiPackDoc>();
  if (doc) {
    for (const emoji of doc.emojis) {
      await deleteEmojiImage(emoji.id);
    }
  }

  return EmojiPackModel.deleteOne({ _id: id }).then((result) => result.deletedCount > 0);
}

export default {
  findEmojiPackById,
  findAllEmojiPacks,
  findEmojiPacksByCreator,
  findEmojiById,
  uploadEmojiImage,
  getEmojiImageStream,
  getEmojiMimeType,
  deleteEmojiImage,
  createEmojiPack,
  updateEmojiPack,
  deleteEmojiPack,
};
