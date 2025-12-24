// Helper functions to transform MongoDB documents for API responses

interface MongooseDocument {
  _id: unknown;
  toObject?: () => Record<string, unknown>;
}

/**
 * Transform a document by replacing _id with id
 * Works with both lean documents and Mongoose documents
 */
export function toApiResponse<T extends MongooseDocument>(
  doc: T | null,
): (Omit<T, "_id" | "toObject"> & { id: string }) | null {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, toObject: _toObject, ...rest } = obj as Record<string, unknown>;
  return { ...rest, id: String(_id) } as Omit<T, "_id" | "toObject"> & { id: string };
}

/**
 * Transform an array of documents by replacing _id with id
 * Works with both lean documents and Mongoose documents
 */
export function toApiResponseArray<T extends MongooseDocument>(
  docs: T[],
): (Omit<T, "_id" | "toObject"> & { id: string })[] {
  return docs.map((doc) => {
    const obj = doc.toObject ? doc.toObject() : doc;
    const { _id, __v, toObject: _toObject, ...rest } = obj as Record<string, unknown>;
    return { ...rest, id: String(_id) } as Omit<T, "_id" | "toObject"> & { id: string };
  });
}
