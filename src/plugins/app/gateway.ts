import fp from "fastify-plugin";
import { GatewayOpCode, type WSMessage } from "../../routes/gateway/types";

declare module "fastify" {
  export interface FastifyInstance {
    clientManager: typeof clientManager;
    broadcast: typeof broadcast;
  }
}

import type { WebSocket } from "ws";

const HEARTBEAT_INTERVAL_MS = 30_000; // send ping every 30s
const HEARTBEAT_TIMEOUT_MS = 90_000; // consider dead after 90s

interface ClientInfo { userId: string | null; lastSeen: number }

const clients = new Map<WebSocket, ClientInfo>();

const addClient = (client: WebSocket, userId?: string) => {
  clients.set(client, { userId: userId || null, lastSeen: Date.now() });
};

const removeClient = (client: WebSocket) => {
  clients.delete(client);
};

const markAlive = (client: WebSocket) => {
  const info = clients.get(client);
  if (info) info.lastSeen = Date.now();
};

const getUserId = (client: WebSocket) => clients.get(client)?.userId || null;

const clientManager = {
  addClient,
  removeClient,
  markAlive,
  getUserId,
};

const broadcast = (message: WSMessage) => {
  const payload = JSON.stringify({
    op: GatewayOpCode[message.type],
    d: message.payload,
  });
  for (const [client] of clients.entries()) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
};

export default fp(
  async function (fastify) {
    fastify.decorate("clientManager", clientManager);
    fastify.decorate("broadcast", broadcast);

    // Heartbeat loop: send ping message and evict stale clients
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [client, info] of clients.entries()) {
        try {
          if (now - info.lastSeen > HEARTBEAT_TIMEOUT_MS) {
            // stale client, terminate
            try {
              client.terminate?.();
            } catch (_) {
              // ignore
            }
            clients.delete(client);
            if (info.userId) {
              fastify.broadcast({ type: "PRESENCE_UPDATE", payload: { userId: info.userId, status: "offline" } });
            }
            continue;
          }

          if (client.readyState === 1) {
            client.send(JSON.stringify({ op: GatewayOpCode.HEARTBEAT, d: { ts: now } }));
          }
        } catch (_) {
          clients.delete(client);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    fastify.addHook("onClose", async () => {
      clearInterval(interval);
    });
  },
  { name: "gateway" },
);
