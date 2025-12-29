import type { FastifyPluginAsync } from "fastify";
import * as userRepo from "../../database/repository/userRepo";
import { GatewayOpCode } from "./types";

const wsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/", {
    schema: {
      tags: ["Gateway"],
      summary: "WebSocket gateway",
      description: "Connect to the WebSocket gateway",
    },
    websocket: true,
  }, async (socket, request) => {
    const token = request.cookies?.at;

    if (!token) {
      socket.send(JSON.stringify({ type: "error", payload: { message: "AUTHENTICATION_REQUIRED" } }));
      socket.close(4001, "AUTHENTICATION_REQUIRED");
      return;
    }

    const payload = fastify.tokenManager.verifyToken("access", token);
    if (!payload) {
      socket.send(JSON.stringify({ type: "error", payload: { message: "INVALID_OR_EXPIRED_REFRESH_TOKEN" } }));
      socket.close(4001, "INVALID_OR_EXPIRED_REFRESH_TOKEN");
      return;
    }

    const user = await userRepo.findUserById(payload.userId);
    if (!user) {
      socket.send(JSON.stringify({ type: "error", payload: { message: "INVALID_USER_TOKEN" } }));
      socket.close(4001, "INVALID_USER_TOKEN");
      return;
    }

    // Add authenticated client
    fastify.clientManager.addClient(socket, user.id);
    fastify.broadcast({ type: "PRESENCE_UPDATE", payload: { userId: user.id, status: "online" } });

    socket.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        // Handle heartbeat pong from client
        if (message && message.op === GatewayOpCode.HEARTBEAT_ACK) {
          fastify.clientManager.markAlive(socket);
          return;
        }

        console.log("WebSocket message received:", message.type);
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    });

    socket.on("close", () => {
      fastify.clientManager.removeClient(socket);
      fastify.broadcast({ type: "PRESENCE_UPDATE", payload: { userId: user.id, status: "offline" } });
    });

    socket.on("error", (error: ErrorEvent) => {
      console.error("WebSocket error:", error);
      fastify.clientManager.removeClient(socket);
      fastify.broadcast({ type: "PRESENCE_UPDATE", payload: { userId: user.id, status: "offline" } });
    });
  });
};

export default wsRoutes;
