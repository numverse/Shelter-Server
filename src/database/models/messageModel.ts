import mongoose, { Schema } from "mongoose";

export interface IReaction {
  emojiId: string;
  userIds: string[];
}

export interface IAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface IMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  replyTo?: string;
  attachments: IAttachment[];
  reactions: IReaction[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface IMessageDoc extends Omit<IMessage, "id"> {
  _id: string;
}

const ReactionSchema: Schema = new Schema(
  {
    emoji: { type: String, required: true },
    userIds: { type: [String], default: [] },
  },
  { _id: false },
);

const AttachmentSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const MessageSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    channelId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    content: { type: String, default: "" },
    replyTo: { type: String },
    attachments: { type: [AttachmentSchema], default: [] },
    reactions: { type: [ReactionSchema], default: [] },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, default: null },
  },
  {
    _id: false,
    timestamps: false,
  },
);

// Compound index for channel messages sorted by time
MessageSchema.index({ channelId: 1, createdAt: -1 });

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
