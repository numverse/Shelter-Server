import { Readable } from "stream";
import { FileModel, getGridFSBucket, type IFile, type IFileDoc } from "../models/fileModel";
import { toApiResponse, toApiResponseArray } from "../utils";
import { Types } from "mongoose";

export async function findFileById(id: string): Promise<IFile | null> {
  const doc = await FileModel.findById(id).lean<IFileDoc>();
  return toApiResponse(doc);
}

export async function findFilesByUploader(uploaderId: string): Promise<IFile[]> {
  const docs = await FileModel.find({ uploaderId }).sort({ createdAt: -1 }).lean<IFileDoc[]>();
  return toApiResponseArray(docs);
}

export async function createFile(data: {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  uploaderId: string;
}): Promise<IFile> {
  const bucket = getGridFSBucket();

  // Upload to GridFS with string id
  const uploadStream = bucket.openUploadStreamWithId(
    new Types.ObjectId(data.id),
    data.filename,
    {
      metadata: {
        contentType: data.mimeType,
        uploaderId: data.uploaderId,
      },
    },
  );

  await new Promise<void>((resolve, reject) => {
    const readable = Readable.from(data.buffer);
    readable.pipe(uploadStream)
      .on("error", reject)
      .on("finish", resolve);
  });

  // Save metadata
  const doc = await FileModel.create({
    _id: data.id, // GridFS file id
    filename: data.filename,
    mimeType: data.mimeType,
    size: data.size,
    uploaderId: data.uploaderId,
  });

  return toApiResponse(doc) as IFile;
}

export async function deleteFile(id: string): Promise<boolean> {
  const bucket = getGridFSBucket();

  try {
    // Delete from GridFS
    await bucket.delete(new Types.ObjectId(id));
  } catch {
    // GridFS file might not exist, continue to delete metadata
  }

  // Delete metadata
  const result = await FileModel.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function deleteFilesByUploader(uploaderId: string): Promise<number> {
  const docs = await FileModel.find({ uploaderId }).lean<IFileDoc[]>();
  const bucket = getGridFSBucket();

  for (const doc of docs) {
    try {
      await bucket.delete(new Types.ObjectId(doc._id));
    } catch {
      // Continue even if GridFS delete fails
    }
  }

  const result = await FileModel.deleteMany({ uploaderId });
  return result.deletedCount;
}

// Get file metadata
export async function findFileMetadataById(id: string): Promise<IFile | null> {
  const doc = await FileModel.findById(id).lean<IFileDoc>();
  return toApiResponse(doc);
}

// Get file stream from GridFS
export function getFileStream(id: string): Readable {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(new Types.ObjectId(id));
}

export default {
  findFileById,
  findFilesByUploader,
  createFile,
  deleteFile,
  deleteFilesByUploader,
  findFileMetadataById,
  getFileStream,
};
