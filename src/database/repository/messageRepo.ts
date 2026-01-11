import { MessageModel, type IMessage, type IMessageDoc, type IAttachment } from "../models/messageModel";
import { toApiResponse, toApiResponseArray } from "../utils";
import * as fileRepo from "./fileRepo";

export async function findMessageById(id: string): Promise<IMessage | null> {
  const doc = await MessageModel.findById(id).lean<IMessageDoc>();
  return toApiResponse(doc);
}

export async function findMessagesByChannel(
  channelId: string, opt: {
    limit: number;
    before?: string;
    after?: string;
    around?: string;
  },
): Promise<IMessage[]> {
  if (opt.around) {
    const docs = await MessageModel.aggregate<IMessageDoc>([
      { $match: { channelId: channelId } },
      {
        $facet: {
          before: [
            { $match: { _id: { $lt: opt.around } } },
            { $sort: { _id: -1 } },
            { $limit: Math.ceil(opt.limit / 2) },
          ],
          after: [
            { $match: { _id: { $gt: opt.around } } },
            { $sort: { _id: 1 } },
            { $limit: Math.floor(opt.limit / 2) },
          ],
        },
      },
    ]);
    return toApiResponseArray<IMessage>(docs).reverse();
  }
  const query: { channelId: string; _id?: { $lt: string } | { $gt: string } } = { channelId };
  if (opt.before) {
    query._id = { $lt: opt.before };
  } else if (opt.after) {
    query._id = { $gt: opt.after };
  }
  const docs = await MessageModel.find(query)
    .sort({ createdAt: -1 })
    .limit(opt.limit)
    .lean<IMessageDoc[]>();
  return toApiResponseArray<IMessage>(docs).reverse();
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
