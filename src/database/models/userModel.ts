import mongoose, { Schema, Types } from "mongoose";

export interface IUser {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  password: string;
  flags: number;
  avatarId?: Types.ObjectId;
  refreshToken?: string;
  emojiPacks: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface IUserDoc extends Omit<IUser, "id"> {
  _id: string;
}

export enum UserFlags {
  NONE = 0,
  EARLY_MEMBER = 1,
  MEMBER = 2,
  MODERATOR = 4,
  DEVELOPER = 8,
}

const UserSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String, required: false },
    email: { type: String, required: true },
    password: { type: String, required: true },
    flags: { type: Number, required: true, default: UserFlags.NONE },
    avatarId: { type: Types.ObjectId, default: null },
    refreshToken: { type: String, default: null },
    emojiPacks: { type: [String], default: [] },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, default: null },
  },
  {
    _id: false,
    timestamps: false,
  },
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true });

export const UserModel = mongoose.model<IUser>("User", UserSchema);

// GridFS bucket for avatar images
let avatarBucket: mongoose.mongo.GridFSBucket | null = null;

export function getAvatarGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!avatarBucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }
    avatarBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "avatars",
    });
  }
  return avatarBucket;
}
