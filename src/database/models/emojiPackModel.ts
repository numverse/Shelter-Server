import mongoose, { Schema } from "mongoose";

export interface IEmoji {
  id: string; // This is also the fileId in the files collection
  name: string;
}

export interface IEmojiPack {
  id: string;
  name: string;
  creatorId: string;
  emojis: IEmoji[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface IEmojiPackDoc extends Omit<IEmojiPack, "id"> {
  _id: string;
}

const EmojiSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const EmojiPackSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    creatorId: { type: String, required: true, index: true },
    emojis: { type: [EmojiSchema], default: [] },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, default: null },
  },
  {
    _id: false,
    timestamps: false,
  },
);

// Indexes
EmojiPackSchema.index({ name: 1 });

export const EmojiPackModel = mongoose.model<IEmojiPack>("EmojiPack", EmojiPackSchema);

// GridFS bucket for emoji images (separate from files bucket)
let emojiBucket: mongoose.mongo.GridFSBucket | null = null;

export function getEmojiGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!emojiBucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }
    emojiBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "emojis",
    });
  }
  return emojiBucket;
}
