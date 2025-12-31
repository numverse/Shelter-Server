import { Readable } from "stream";
import { UserFlags, UserModel, getAvatarGridFSBucket, type IUser, type IUserDoc } from "../models/userModel";
import { toApiResponse, toApiResponseArray } from "../utils";
import { Types, UpdateQuery } from "mongoose";

export async function existsUserById(id: string): Promise<boolean> {
  const exists = await UserModel.exists({ _id: id });
  return exists !== null;
}

export async function existsUserByUsername(username: string): Promise<boolean> {
  const exists = await UserModel.exists({ username });
  return exists !== null;
}

export async function existsUserByEmail(email: string): Promise<boolean> {
  const exists = await UserModel.exists({ email });
  return exists !== null;
}

export async function findUserById(id: string): Promise<IUser | null> {
  const doc = await UserModel.findById(id).lean<IUserDoc>();
  return toApiResponse(doc);
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  const doc = await UserModel.findOne({ email }).lean<IUserDoc>();
  return toApiResponse(doc);
}

export async function findUserByUsername(username: string): Promise<IUser | null> {
  const doc = await UserModel.findOne({ username }).lean<IUserDoc>();
  return toApiResponse(doc);
}

export async function findAllUsers(): Promise<IUser[]> {
  const docs = await UserModel.find().lean<IUserDoc[]>();
  return toApiResponseArray(docs);
}

export async function findUsersByIds(ids: string[]): Promise<IUser[]> {
  const docs = await UserModel.find({ _id: { $in: ids } }).lean<IUserDoc[]>();
  return toApiResponseArray(docs);
}

export async function findUsersByUsernames(usernames: string[]): Promise<IUser[]> {
  const docs = await UserModel.find({ username: { $in: usernames } }).lean<IUserDoc[]>();
  return toApiResponseArray(docs);
}

export async function hasAllUserFlags(id: string, ...flags: UserFlags[]): Promise<boolean> {
  const exists = await UserModel.exists({ _id: id, flags: { $bitsAllSet: flags.reduce((acc, flag) => acc | flag, 0) } });
  return exists !== null;
}

export async function hasAnyUserFlags(id: string, ...flags: UserFlags[]): Promise<boolean> {
  const exists = await UserModel.exists({ _id: id, flags: { $bitsAnySet: flags.reduce((acc, flag) => acc | flag, 0) } });
  return exists !== null;
}

export async function createUser(data: {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  password: string;
}): Promise<IUser> {
  const doc = await UserModel.create({
    _id: data.id,
    username: data.username,
    email: data.email,
    password: data.password,
    displayName: data.displayName,
    emojiPacks: [],
  });
  return toApiResponse(doc) as IUser;
}

export async function updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
  const result = await UserModel.updateOne(
    { _id: id },
    {
      $set: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    },
  );
  return result.modifiedCount > 0;
}

export async function updateUserProfile(id: string, data: {
  username?: string; displayName?: string; avatarId?: Types.ObjectId | null;
}): Promise<IUser | null> {
  const doc = await UserModel.findByIdAndUpdate(
    id,
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    },
    { new: true },
  ).lean<IUserDoc>();
  return toApiResponse(doc);
}

export async function setUserFlags(id: string, flags: number): Promise<IUser | null> {
  const doc = await UserModel.findByIdAndUpdate(
    id,
    {
      $set: {
        flags,
        updatedAt: new Date(),
      },
    },
    { new: true },
  ).lean<IUserDoc>();
  return toApiResponse(doc);
}

export async function updateUser(id: string, patch: Partial<Omit<IUser,
  "id" | "updatedAt" | "createdAt">>): Promise<IUser | null> {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};

  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined) $unset[k] = "";
    else $set[k] = v;
  }

  const update: Record<string, UpdateQuery<IUser>> = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  const doc = await UserModel.findByIdAndUpdate(
    id,
    update,
    { new: true },
  ).lean<IUserDoc>();
  return toApiResponse(doc);
}

// Upload avatar image to GridFS
export async function uploadAvatar(avatarId: Types.ObjectId, buffer: Buffer, mimeType: string): Promise<void> {
  const bucket = getAvatarGridFSBucket();

  const uploadStream = bucket.openUploadStreamWithId(
    avatarId,
    avatarId.toString(),
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

// Get avatar image stream from GridFS
export function getAvatarStream(avatarId: string | Types.ObjectId): Readable {
  const bucket = getAvatarGridFSBucket();
  return bucket.openDownloadStream(new Types.ObjectId(avatarId));
}

// Get avatar mimeType from GridFS metadata
export async function getAvatarMimeType(avatarId: string | Types.ObjectId): Promise<string> {
  const bucket = getAvatarGridFSBucket();
  const files = await bucket.find({ _id: new Types.ObjectId(avatarId) }).toArray();
  if (files.length > 0 && files[0].metadata?.contentType) {
    return files[0].metadata.contentType as string;
  }
  return "image/png"; // default
}

// Delete avatar from GridFS
export async function deleteAvatar(avatarId: string | Types.ObjectId): Promise<void> {
  const bucket = getAvatarGridFSBucket();
  try {
    await bucket.delete(new Types.ObjectId(avatarId));
  } catch {
    // Ignore if not found
  }
}

export async function addUserEmojiPack(userId: string, packId: string): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    { $addToSet: { emojiPacks: packId } },
  );
}

export async function removeUserEmojiPack(userId: string, packId: string): Promise<void> {
  await UserModel.updateOne(
    { _id: userId },
    { $pull: { emojiPacks: packId } },
  );
}

export function deleteUser(id: string): Promise<boolean> {
  return UserModel.deleteOne({ _id: id }).then((result) => result.deletedCount > 0);
}
