import { IMessage } from "src/database/models/messageModel";
import { Channel } from "src/database/models/channelModel";

export type BroadcastFn = (message: string) => void;

export interface ReactionPayload {
  messageId: string;
  emojiId: string;
  userId: string;
}

export interface PresenceUpdatePayload {
  userId: string;
  status: "online" | "offline" | "away" | "dnd";
}

type PartialWithId<T> = Partial<T> & { id: string };

// Discriminated union for WebSocket messages
export type WSMessage
  = | { type: "MESSAGE_CREATE"; payload: IMessage }
    | { type: "MESSAGE_UPDATE"; payload: IMessage }
    | { type: "MESSAGE_DELETE"; payload: { channelId: string; messageId: string } }
    | { type: "REACTION_ADD"; payload: ReactionPayload }
    | { type: "REACTION_REMOVE"; payload: ReactionPayload }
    | { type: "PRESENCE_UPDATE"; payload: PresenceUpdatePayload }
    | { type: "CHANNEL_CREATE"; payload: Channel }
    | { type: "CHANNEL_UPDATE"; payload: PartialWithId<Channel> }
    | { type: "CHANNEL_DELETE"; payload: { channelId: string } }
    | { type: "MULTIPLE_CHANNEL_UPDATE"; payload: PartialWithId<Channel>[] };

export enum GatewayOpCode {
  DISPATCH = 0,
  HEARTBEAT = 1,
  HEARTBEAT_ACK = 2,
  MESSAGE_CREATE = 3,
  MESSAGE_UPDATE = 4,
  MESSAGE_DELETE = 5,
  REACTION_ADD = 6,
  REACTION_REMOVE = 7,
  PRESENCE_UPDATE = 8,
  CHANNEL_CREATE = 9,
  CHANNEL_UPDATE = 10,
  CHANNEL_DELETE = 11,
  MULTIPLE_CHANNEL_UPDATE = 12,
}
