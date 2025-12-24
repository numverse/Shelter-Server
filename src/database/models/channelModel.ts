import mongoose, { Schema } from "mongoose";

export interface IChannel {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IChannelDoc extends Omit<IChannel, "id"> {
  _id: string;
}

const ChannelSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, default: null },
  },
  {
    _id: false,
    timestamps: false,
  },
);

// Indexes
ChannelSchema.index({ name: 1 });

export const ChannelModel = mongoose.model<IChannel>("Channel", ChannelSchema);
