import { MessageModel, type IMessage, type IMessageDoc, type IAttachment } from "../models/messageModel";
import { toApiResponse, toApiResponseArray } from "../utils";
import * as fileRepo from "./fileRepo";

export async function findMessageById(id: string): Promise<IMessage | null> {
  const doc = await MessageModel.findById(id).lean<IMessageDoc>();
  return toApiResponse(doc);
}

export async function findMessagesByChannel(
  channelId: string,
  limit = 50,
  before?: string,
): Promise<{ messages: IMessage[]; hasMore: boolean }> {
  const query: { channelId: string; _id?: { $lt: string } } = { channelId };
  if (before) {
    query._id = { $lt: before };
  }
  const docs = await MessageModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean<IMessageDoc[]>();

  const hasMore = docs.length > limit;
  const resultDocs = hasMore ? docs.slice(0, limit) : docs;
  const messages = toApiResponseArray(resultDocs).reverse();

  return { messages, hasMore };
}

export async function findMessagesAround(
  messageId: string,
  beforeCount = 20,
  afterCount = 20,
): Promise<{
  anchor: IMessage | null;
  before: { messages: IMessage[]; hasMore: boolean };
  after: { messages: IMessage[]; hasMore: boolean };
}> {
  const anchorDoc = await MessageModel.findById(messageId).lean<IMessageDoc>();
  if (!anchorDoc) return { anchor: null, before: { messages: [], hasMore: false }, after: { messages: [], hasMore: false } };

  // messages before (older): _id < messageId, sort desc, then reverse to chronological asc
  const beforeDocs = await MessageModel.find({ channelId: anchorDoc.channelId, _id: { $lt: messageId } })
    .sort({ _id: -1 })
    .limit(beforeCount + 1)
    .lean<IMessageDoc[]>();

  const afterDocs = await MessageModel.find({ channelId: anchorDoc.channelId, _id: { $gt: messageId } })
    .sort({ _id: 1 })
    .limit(afterCount + 1)
    .lean<IMessageDoc[]>();

  const before = toApiResponseArray(beforeDocs).reverse();
  const after = toApiResponseArray(afterDocs);
  const anchor = toApiResponse(anchorDoc);

  return {
    anchor, before: {
      messages: before.length > beforeCount ? before.slice(1) : before,
      hasMore: before.length > beforeCount,
    }, after: {
      messages: after.length > afterCount ? after.slice(1) : after,
      hasMore: after.length > afterCount,
    },
  };
}

export async function createMessage(data: {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  replyTo?: string;
  attachments?: IAttachment[];
}): Promise<IMessage> {
  const doc = await MessageModel.create({
    _id: data.id,
    channelId: data.channelId,
    authorId: data.authorId,
    content: data.content,
    replyTo: data.replyTo,
    attachments: data.attachments || [],
  });
  return toApiResponse(doc) as IMessage;
}

export async function updateMessageContent(id: string, content: string): Promise<IMessage | null> {
  const doc = await MessageModel.findByIdAndUpdate(
    id,
    { $set: { content, updatedAt: new Date() } },
    { new: true },
  ).lean<IMessageDoc>();
  return toApiResponse(doc);
}

export async function addReaction(id: string, emojiId: string, userId: string): Promise<IMessage | null> {
  const doc = await MessageModel.findByIdAndUpdate(
    id,
    [
      {
        $set: {
          reactions: {
            $cond: {
              if: { $in: [emojiId, "$reactions.emojiId"] },
              // emojiId exists: add userId to that reaction
              then: {
                $map: {
                  input: "$reactions",
                  as: "reaction",
                  in: {
                    emojiId: "$$reaction.emojiId",
                    userIds: {
                      $cond: {
                        if: { $eq: ["$$reaction.emojiId", emojiId] },
                        then: { $setUnion: ["$$reaction.userIds", [userId]] },
                        else: "$$reaction.userIds",
                      },
                    },
                  },
                },
              },
              // emojiId doesn't exist: add new reaction
              else: { $concatArrays: ["$reactions", [{ emojiId, userIds: [userId] }]] },
            },
          },
        },
      },
    ],
    { new: true },
  ).lean<IMessageDoc>();
  return toApiResponse(doc);
}

export async function removeAttachment(messageId: string, attachmentId: string): Promise<IMessage | null> {
  await fileRepo.deleteFile(attachmentId);
  const doc = await MessageModel.findByIdAndUpdate(
    messageId,
    [
      {
        $pull: {
          attachments: { id: attachmentId },
        },
      },
    ],
    { new: true },
  ).lean<IMessageDoc>();
  return toApiResponse(doc);
}

export async function removeReaction(id: string, emojiId: string, userId: string): Promise<IMessage | null> {
  const doc = await MessageModel.findByIdAndUpdate(
    id,
    [
      {
        $set: {
          reactions: {
            $filter: {
              input: {
                $map: {
                  input: "$reactions",
                  as: "reaction",
                  in: {
                    emojiId: "$$reaction.emojiId",
                    userIds: {
                      $cond: {
                        if: { $eq: ["$$reaction.emojiId", emojiId] },
                        then: { $filter: { input: "$$reaction.userIds", cond: { $ne: ["$$this", userId] } } },
                        else: "$$reaction.userIds",
                      },
                    },
                  },
                },
              },
              cond: { $gt: [{ $size: "$$this.userIds" }, 0] },
            },
          },
        },
      },
    ],
    { new: true },
  ).lean<IMessageDoc>();
  return toApiResponse(doc);
}

export function deleteMessage(id: string): Promise<boolean> {
  return MessageModel.deleteOne({ _id: id }).then((result) => result.deletedCount > 0);
}

export function deleteMessagesByChannel(channelId: string): Promise<number> {
  return MessageModel.deleteMany({ channelId }).then((result) => result.deletedCount);
}

export default {
  removeAttachment,
  findMessageById,
  findMessagesByChannel,
  createMessage,
  updateMessageContent,
  addReaction,
  removeReaction,
  deleteMessage,
  deleteMessagesByChannel,
};
