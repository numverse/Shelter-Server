import fp from "fastify-plugin";
import fastifyWebsocket from "@fastify/websocket";

export default fp(async function (fastify) {
  await fastify.register(fastifyWebsocket, {
    options: {
      maxPayload: 1048576, // 1MB
      clientTracking: true,
      perMessageDeflate: false,
    },
  });
});
