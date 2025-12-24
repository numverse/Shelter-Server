import mongoose, { Schema } from "mongoose";

export interface IFile {
  id: string; // GridFS file id
  filename: string;
  mimeType: string;
  size: number;
  uploaderId: string;
  createdAt: Date;
}

export interface IFileDoc extends Omit<IFile, "id"> {
  _id: string;
}

const FileSchema: Schema = new Schema(
  {
    _id: { type: String, required: true }, // GridFS file id
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploaderId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    _id: false,
    timestamps: false,
  },
);

// Indexes
FileSchema.index({ createdAt: -1 });

export const FileModel = mongoose.model<IFile>("File", FileSchema);

// GridFS bucket instance
let bucket: mongoose.mongo.GridFSBucket | null = null;

export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!bucket) {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }
    bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "uploads",
    });
  }
  return bucket;
}
