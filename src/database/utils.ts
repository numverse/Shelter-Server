// Helper functions to transform MongoDB documents for API responses

interface MongooseDocument {
  _id: unknown;
  toObject?: () => Record<string, unknown>;
}

/**
 * Transform a document by replacing _id with id
 * Works with both lean documents and Mongoose documents
 */
export function toApiResponse<T>(doc: MongooseDocument | null): T {
  if (!doc) return null as T;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, __v, toObject: _toObject, ...rest } = obj as Record<string, unknown>;
  return { ...rest, id: String(_id) } as T;
}

/**
 * Transform an array of documents by replacing _id with id
 * Works with both lean documents and Mongoose documents
 */
export function toApiResponseArray<T>(docs: MongooseDocument[]): T[] {
  return docs.map((doc) => {
    const obj = doc.toObject ? doc.toObject() : doc;
    const { _id, __v, toObject: _toObject, ...rest } = obj as Record<string, unknown>;
    return { ...rest, id: String(_id) } as T;
  });
}
